import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CheckSchedulerService } from '../queue/check-scheduler.service';
import { CreateMonitorDto } from './dto/create-monitor.dto';
import { UpdateMonitorDto } from './dto/update-monitor.dto';
import { ListChecksDto } from './dto/list-checks.dto';
import { Monitor, CheckResult, Prisma, MonitorType, CheckStatus } from '@prisma/client';

export interface MonitorWithStats extends Monitor {
  lastCheck?: CheckResult | null;
  uptime24h?: number;
}

@Injectable()
export class MonitorsService {
  private readonly logger = new Logger(MonitorsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly checkScheduler: CheckSchedulerService,
  ) {}

  async create(userId: string, createMonitorDto: CreateMonitorDto): Promise<Monitor> {
    // Set default values based on monitor type
    let config = createMonitorDto.config || {};
    let interval = createMonitorDto.interval;
    let gracePeriod = createMonitorDto.gracePeriod;

    if (createMonitorDto.type === MonitorType.http) {
      interval = interval || 5; // Default 5 minutes
    } else if (createMonitorDto.type === MonitorType.cron) {
      gracePeriod = gracePeriod || 5; // Default 5 minutes grace period
    }

    const monitor = await this.prisma.monitor.create({
      data: {
        name: createMonitorDto.name,
        type: createMonitorDto.type,
        config: config as Prisma.JsonObject,
        interval,
        gracePeriod,
        userId,
      },
    });

    // Schedule the monitor
    await this.checkScheduler.scheduleMonitor(monitor);

    this.logger.log(`Created monitor ${monitor.id} for user ${userId}`);
    return monitor;
  }

  async findAll(userId: string): Promise<MonitorWithStats[]> {
    const monitors = await this.prisma.monitor.findMany({
      where: { userId },
      include: {
        checkResults: {
          orderBy: { checkedAt: 'desc' },
          take: 1,
        },
        _count: {
          select: { checkResults: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    // Calculate uptime for last 24 hours for each monitor
    const monitorsWithStats = await Promise.all(
      monitors.map(async (monitor) => {
        const last24Hours = new Date(Date.now() - 24 * 60 * 60 * 1000);
        
        const checks = await this.prisma.checkResult.findMany({
          where: {
            monitorId: monitor.id,
            checkedAt: { gte: last24Hours },
            status: { in: [CheckStatus.up, CheckStatus.down] },
          },
        });

        const upCount = checks.filter((c) => c.status === CheckStatus.up).length;
        const totalCount = checks.length;
        const uptime24h = totalCount > 0 ? (upCount / totalCount) * 100 : 100;

        return {
          ...monitor,
          lastCheck: monitor.checkResults[0] || null,
          checkResults: undefined,
          uptime24h: Math.round(uptime24h * 100) / 100,
        };
      }),
    );

    return monitorsWithStats;
  }

  async findOne(userId: string, id: string): Promise<MonitorWithStats> {
    const monitor = await this.prisma.monitor.findUnique({
      where: { id },
      include: {
        checkResults: {
          orderBy: { checkedAt: 'desc' },
          take: 10,
        },
        alertChannels: true,
        incidents: {
          where: { resolvedAt: null },
          orderBy: { startedAt: 'desc' },
        },
      },
    });

    if (!monitor) {
      throw new NotFoundException('Monitor not found');
    }

    if (monitor.userId !== userId) {
      throw new ForbiddenException('You do not have access to this monitor');
    }

    // Calculate 24h uptime
    const last24Hours = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const checks = await this.prisma.checkResult.findMany({
      where: {
        monitorId: monitor.id,
        checkedAt: { gte: last24Hours },
        status: { in: [CheckStatus.up, CheckStatus.down] },
      },
    });

    const upCount = checks.filter((c) => c.status === CheckStatus.up).length;
    const totalCount = checks.length;
    const uptime24h = totalCount > 0 ? (upCount / totalCount) * 100 : 100;

    return {
      ...monitor,
      lastCheck: monitor.checkResults[0] || null,
      uptime24h: Math.round(uptime24h * 100) / 100,
    };
  }

  async update(
    userId: string,
    id: string,
    updateMonitorDto: UpdateMonitorDto,
  ): Promise<Monitor> {
    const monitor = await this.prisma.monitor.findUnique({
      where: { id },
    });

    if (!monitor) {
      throw new NotFoundException('Monitor not found');
    }

    if (monitor.userId !== userId) {
      throw new ForbiddenException('You do not have access to this monitor');
    }

    const updateData: Prisma.MonitorUpdateInput = {};

    if (updateMonitorDto.name !== undefined) {
      updateData.name = updateMonitorDto.name;
    }

    if (updateMonitorDto.config !== undefined) {
      updateData.config = updateMonitorDto.config as Prisma.JsonObject;
    }

    if (updateMonitorDto.interval !== undefined) {
      updateData.interval = updateMonitorDto.interval;
    }

    if (updateMonitorDto.gracePeriod !== undefined) {
      updateData.gracePeriod = updateMonitorDto.gracePeriod;
    }

    const updatedMonitor = await this.prisma.monitor.update({
      where: { id },
      data: updateData,
    });

    // Update scheduler
    await this.checkScheduler.updateSchedule(updatedMonitor);

    this.logger.log(`Updated monitor ${id}`);
    return updatedMonitor;
  }

  async remove(userId: string, id: string): Promise<void> {
    const monitor = await this.prisma.monitor.findUnique({
      where: { id },
    });

    if (!monitor) {
      throw new NotFoundException('Monitor not found');
    }

    if (monitor.userId !== userId) {
      throw new ForbiddenException('You do not have access to this monitor');
    }

    // Remove from scheduler
    await this.checkScheduler.deleteMonitor(id);

    // Delete monitor (cascades to checkResults, incidents, alertChannels)
    await this.prisma.monitor.delete({
      where: { id },
    });

    this.logger.log(`Deleted monitor ${id}`);
  }

  async pause(userId: string, id: string): Promise<Monitor> {
    const monitor = await this.prisma.monitor.findUnique({
      where: { id },
    });

    if (!monitor) {
      throw new NotFoundException('Monitor not found');
    }

    if (monitor.userId !== userId) {
      throw new ForbiddenException('You do not have access to this monitor');
    }

    const updatedMonitor = await this.prisma.monitor.update({
      where: { id },
      data: { isPaused: true },
    });

    await this.checkScheduler.pauseMonitor(id);

    this.logger.log(`Paused monitor ${id}`);
    return updatedMonitor;
  }

  async resume(userId: string, id: string): Promise<Monitor> {
    const monitor = await this.prisma.monitor.findUnique({
      where: { id },
    });

    if (!monitor) {
      throw new NotFoundException('Monitor not found');
    }

    if (monitor.userId !== userId) {
      throw new ForbiddenException('You do not have access to this monitor');
    }

    const updatedMonitor = await this.prisma.monitor.update({
      where: { id },
      data: { isPaused: false },
    });

    await this.checkScheduler.resumeMonitor(updatedMonitor);

    this.logger.log(`Resumed monitor ${id}`);
    return updatedMonitor;
  }

  async findChecks(
    userId: string,
    monitorId: string,
    query: ListChecksDto,
  ): Promise<{ data: CheckResult[]; total: number; page: number; limit: number }> {
    const monitor = await this.prisma.monitor.findUnique({
      where: { id: monitorId },
    });

    if (!monitor) {
      throw new NotFoundException('Monitor not found');
    }

    if (monitor.userId !== userId) {
      throw new ForbiddenException('You do not have access to this monitor');
    }

    const page = query.page || 1;
    const limit = query.limit || 20;
    const skip = (page - 1) * limit;

    const where: Prisma.CheckResultWhereInput = {
      monitorId,
    };

    if (query.status) {
      where.status = query.status;
    }

    const [data, total] = await Promise.all([
      this.prisma.checkResult.findMany({
        where,
        orderBy: { checkedAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.checkResult.count({ where }),
    ]);

    return {
      data,
      total,
      page,
      limit,
    };
  }
}
