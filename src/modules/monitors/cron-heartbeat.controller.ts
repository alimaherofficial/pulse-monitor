import { Controller, Get, Param, NotFoundException, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { MonitorType, CheckStatus } from '@prisma/client';

@Controller('ping')
export class CronHeartbeatController {
  private readonly logger = new Logger(CronHeartbeatController.name);

  constructor(private readonly prisma: PrismaService) {}

  @Get(':monitorId')
  async ping(@Param('monitorId') monitorId: string): Promise<{ message: string; timestamp: string }> {
    // Find the monitor
    const monitor = await this.prisma.monitor.findUnique({
      where: { id: monitorId },
    });

    if (!monitor) {
      throw new NotFoundException('Monitor not found');
    }

    if (monitor.type !== MonitorType.cron) {
      throw new NotFoundException('Monitor is not a cron type');
    }

    if (monitor.isPaused) {
      return {
        message: 'Monitor is paused, ping ignored',
        timestamp: new Date().toISOString(),
      };
    }

    // Update lastPingAt in config
    const config = (monitor.config as Record<string, any>) || {};
    const previousPingAt = config.lastPingAt;
    config.lastPingAt = new Date().toISOString();

    await this.prisma.monitor.update({
      where: { id: monitorId },
      data: {
        config,
      },
    });

    // Record the ping as an "up" check result
    await this.prisma.checkResult.create({
      data: {
        monitorId,
        status: CheckStatus.up,
        checkedAt: new Date(),
      },
    });

    // Resolve any open incidents (cron is back up)
    const openIncident = await this.prisma.incident.findFirst({
      where: {
        monitorId,
        resolvedAt: null,
      },
      orderBy: {
        startedAt: 'desc',
      },
    });

    if (openIncident) {
      await this.prisma.incident.update({
        where: { id: openIncident.id },
        data: { resolvedAt: new Date() },
      });
      this.logger.log(`Cron monitor ${monitorId} recovered after ping`);
    }

    this.logger.debug(`Received ping for cron monitor ${monitorId}`);

    return {
      message: 'Ping received',
      timestamp: new Date().toISOString(),
    };
  }
}
