import { Processor, WorkerHost, OnWorkerEvent } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { Job } from 'bullmq';
import { CheckStatus } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { AlertsService } from '../../alerts/alerts.service';
import { QUEUE_NAMES, JOB_NAMES } from '../interfaces/queue.interface';
import { AlertContext } from '../../alerts/interfaces/alert.interface';

@Processor(QUEUE_NAMES.CRON_CHECKS)
export class CronCheckProcessor extends WorkerHost {
  private readonly logger = new Logger(CronCheckProcessor.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly alertsService: AlertsService,
  ) {
    super();
  }

  async process(job: Job<any>): Promise<void> {
    if (job.name !== JOB_NAMES.CRON_CHECK) {
      return;
    }

    const { monitorId, userId, gracePeriodMinutes } = job.data;

    this.logger.debug(`Processing cron check for monitor ${monitorId}`);

    const monitor = await this.prisma.monitor.findUnique({
      where: { id: monitorId },
    });

    if (!monitor) {
      this.logger.error(`Monitor ${monitorId} not found`);
      return;
    }

    if (monitor.isPaused) {
      this.logger.debug(`Monitor ${monitorId} is paused, skipping check`);
      return;
    }

    // Get config
    const config = monitor.config as Record<string, any>;
    const expectedIntervalMinutes = config.expectedIntervalMinutes || 60;

    // Calculate expected ping time
    const now = new Date();
    const lastPingAt = config.lastPingAt ? new Date(config.lastPingAt as string) : null;

    // If never pinged, check if we're past the initial grace period
    if (!lastPingAt) {
      // Check if enough time has passed since monitor creation
      const timeSinceCreation = now.getTime() - monitor.createdAt.getTime();
      const gracePeriodMs = (expectedIntervalMinutes + gracePeriodMinutes) * 60 * 1000;

      if (timeSinceCreation > gracePeriodMs) {
        // Mark as down - never received initial ping
        await this.recordDownStatus(monitorId, 'Never received initial ping');
        this.logger.warn(`Cron monitor ${monitorId} never received initial ping`);
      } else {
        this.logger.debug(`Cron monitor ${monitorId} waiting for initial ping`);
      }
      return;
    }

    // Check if a ping was missed
    const timeSinceLastPing = now.getTime() - lastPingAt.getTime();
    const expectedIntervalMs = (expectedIntervalMinutes + gracePeriodMinutes) * 60 * 1000;

    if (timeSinceLastPing > expectedIntervalMs) {
      // Ping was missed
      const missedByMinutes = Math.floor(timeSinceLastPing / (60 * 1000));
      await this.recordDownStatus(
        monitorId,
        `Missed ping by ${missedByMinutes} minutes (expected every ${expectedIntervalMinutes} minutes with ${gracePeriodMinutes} minute grace period)`,
      );
      this.logger.warn(`Cron monitor ${monitorId} missed ping by ${missedByMinutes} minutes`);
    } else {
      // Ping was on time - record as up
      await this.recordUpStatus(monitorId);
      this.logger.debug(`Cron monitor ${monitorId} ping is on schedule`);
    }
  }

  private async recordDownStatus(monitorId: string, errorMessage: string): Promise<void> {
    // Get monitor details
    const monitor = await this.prisma.monitor.findUnique({
      where: { id: monitorId },
      include: { user: true },
    });

    if (!monitor) return;

    // Check if we already recorded this as down recently
    const lastCheck = await this.prisma.checkResult.findFirst({
      where: { monitorId },
      orderBy: { checkedAt: 'desc' },
    });

    const previousStatus = lastCheck?.status;

    if (lastCheck?.status === CheckStatus.down) {
      // Already recorded as down, don't create duplicate incident
      return;
    }

    await this.prisma.checkResult.create({
      data: {
        monitorId,
        status: CheckStatus.down,
        errorMessage,
        checkedAt: new Date(),
      },
    });

    // Create incident
    await this.prisma.incident.create({
      data: {
        monitorId,
        startedAt: new Date(),
        errorMessage,
      },
    });

    // Trigger alert
    const alertContext: AlertContext = {
      monitorId: monitor.id,
      monitorName: monitor.name,
      monitorType: monitor.type,
      status: CheckStatus.down,
      previousStatus,
      errorMessage,
      timestamp: new Date(),
    };
    await this.alertsService.sendAlert(alertContext);

    this.logger.log(`Cron monitor ${monitorId} is DOWN - incident and alert created`);
  }

  private async recordUpStatus(monitorId: string): Promise<void> {
    // Get monitor details
    const monitor = await this.prisma.monitor.findUnique({
      where: { id: monitorId },
      include: { user: true },
    });

    if (!monitor) return;

    const lastCheck = await this.prisma.checkResult.findFirst({
      where: { monitorId },
      orderBy: { checkedAt: 'desc' },
    });

    const previousStatus = lastCheck?.status;

    if (lastCheck?.status === CheckStatus.up) {
      // Already recorded as up
      return;
    }

    await this.prisma.checkResult.create({
      data: {
        monitorId,
        status: CheckStatus.up,
        checkedAt: new Date(),
      },
    });

    // Resolve any open incidents
    const unresolvedIncident = await this.prisma.incident.findFirst({
      where: {
        monitorId,
        resolvedAt: null,
      },
      orderBy: {
        startedAt: 'desc',
      },
    });

    if (unresolvedIncident) {
      await this.prisma.incident.update({
        where: { id: unresolvedIncident.id },
        data: { resolvedAt: new Date() },
      });

      // Trigger recovery alert
      const alertContext: AlertContext = {
        monitorId: monitor.id,
        monitorName: monitor.name,
        monitorType: monitor.type,
        status: CheckStatus.up,
        previousStatus,
        timestamp: new Date(),
      };
      await this.alertsService.sendAlert(alertContext);

      this.logger.log(`Cron monitor ${monitorId} is UP - incident resolved and recovery alert sent`);
    }
  }

  @OnWorkerEvent('failed')
  onFailed(job: Job<any>, error: Error): void {
    this.logger.error(
      `Cron check job ${job.id} for monitor ${job.data.monitorId} failed:`,
      error.stack,
    );
  }
}
