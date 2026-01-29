import { Injectable, Logger } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue, Job } from 'bullmq';
import { Monitor, MonitorType, Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CheckJobData, CronCheckJobData, JOB_NAMES, QUEUE_NAMES } from './interfaces/queue.interface';

@Injectable()
export class CheckSchedulerService {
  private readonly logger = new Logger(CheckSchedulerService.name);

  constructor(
    @InjectQueue(QUEUE_NAMES.HTTP_CHECKS)
    private readonly httpCheckQueue: Queue<CheckJobData>,
    @InjectQueue(QUEUE_NAMES.CRON_CHECKS)
    private readonly cronCheckQueue: Queue<CronCheckJobData>,
    private readonly prisma: PrismaService,
  ) {}

  async scheduleMonitor(monitor: Monitor): Promise<void> {
    if (monitor.isPaused) {
      this.logger.debug(`Monitor ${monitor.id} is paused, skipping scheduling`);
      return;
    }

    switch (monitor.type) {
      case MonitorType.http:
        await this.scheduleHttpMonitor(monitor);
        break;
      case MonitorType.cron:
        await this.scheduleCronMonitor(monitor);
        break;
      case MonitorType.ssl:
        // SSL checks will be implemented later
        this.logger.debug(`SSL monitor ${monitor.id} scheduling not yet implemented`);
        break;
      default:
        this.logger.warn(`Unknown monitor type: ${monitor.type}`);
    }
  }

  private async scheduleHttpMonitor(monitor: Monitor): Promise<void> {
    const intervalMinutes = monitor.interval || 5;
    const jobId = this.getJobId(monitor.id);

    // Remove existing job if any
    await this.removeScheduledJob(monitor.id);

    // Create new repeatable job
    const job = await this.httpCheckQueue.add(
      JOB_NAMES.HTTP_CHECK,
      {
        monitorId: monitor.id,
        userId: monitor.userId,
      },
      {
        jobId,
        repeat: {
          every: intervalMinutes * 60 * 1000, // Convert minutes to milliseconds
        },
      },
    );

    this.logger.log(`Scheduled HTTP monitor ${monitor.id} with interval ${intervalMinutes} minutes`);
    return;
  }

  private async scheduleCronMonitor(monitor: Monitor): Promise<void> {
    const gracePeriodMinutes = monitor.gracePeriod || 5;
    const jobId = this.getJobId(monitor.id);

    // Remove existing job if any
    await this.removeScheduledJob(monitor.id);

    // For cron monitors, we schedule a check job that verifies if a ping was received
    // The job runs based on the expected interval + grace period
    const config = monitor.config as Prisma.JsonObject;
    const expectedIntervalMinutes = (config.expectedIntervalMinutes as number) || 60;

    const job = await this.cronCheckQueue.add(
      JOB_NAMES.CRON_CHECK,
      {
        monitorId: monitor.id,
        userId: monitor.userId,
        gracePeriodMinutes,
      },
      {
        jobId,
        repeat: {
          every: (expectedIntervalMinutes + gracePeriodMinutes) * 60 * 1000,
        },
      },
    );

    this.logger.log(`Scheduled Cron monitor ${monitor.id} with grace period ${gracePeriodMinutes} minutes`);
  }

  async removeScheduledJob(monitorId: string): Promise<void> {
    const jobId = this.getJobId(monitorId);

    // Remove from HTTP checks queue
    const httpJob = await this.httpCheckQueue.getJob(jobId);
    if (httpJob) {
      await httpJob.remove();
      this.logger.debug(`Removed HTTP job for monitor ${monitorId}`);
    }

    // Also check for repeatable jobs
    const repeatableJobs = await this.httpCheckQueue.getRepeatableJobs();
    for (const repeatableJob of repeatableJobs) {
      if (repeatableJob.name === jobId || repeatableJob.key.includes(monitorId)) {
        await this.httpCheckQueue.removeRepeatableByKey(repeatableJob.key);
        this.logger.debug(`Removed repeatable HTTP job for monitor ${monitorId}`);
      }
    }

    // Remove from Cron checks queue
    const cronJob = await this.cronCheckQueue.getJob(jobId);
    if (cronJob) {
      await cronJob.remove();
      this.logger.debug(`Removed Cron job for monitor ${monitorId}`);
    }

    const cronRepeatableJobs = await this.cronCheckQueue.getRepeatableJobs();
    for (const repeatableJob of cronRepeatableJobs) {
      if (repeatableJob.name === jobId || repeatableJob.key.includes(monitorId)) {
        await this.cronCheckQueue.removeRepeatableByKey(repeatableJob.key);
        this.logger.debug(`Removed repeatable Cron job for monitor ${monitorId}`);
      }
    }
  }

  async pauseMonitor(monitorId: string): Promise<void> {
    await this.removeScheduledJob(monitorId);
    this.logger.log(`Paused monitor ${monitorId}`);
  }

  async resumeMonitor(monitor: Monitor): Promise<void> {
    await this.scheduleMonitor(monitor);
    this.logger.log(`Resumed monitor ${monitor.id}`);
  }

  async updateSchedule(monitor: Monitor): Promise<void> {
    if (monitor.isPaused) {
      await this.pauseMonitor(monitor.id);
    } else {
      await this.scheduleMonitor(monitor);
    }
  }

  async deleteMonitor(monitorId: string): Promise<void> {
    await this.removeScheduledJob(monitorId);
    this.logger.log(`Deleted monitor ${monitorId} from scheduler`);
  }

  private getJobId(monitorId: string): string {
    return `monitor-${monitorId}`;
  }

  // Initialize schedules for all active monitors on startup
  async initializeSchedules(): Promise<void> {
    this.logger.log('Initializing monitor schedules...');

    const activeMonitors = await this.prisma.monitor.findMany({
      where: {
        isPaused: false,
      },
    });

    for (const monitor of activeMonitors) {
      try {
        await this.scheduleMonitor(monitor);
      } catch (error) {
        this.logger.error(`Failed to schedule monitor ${monitor.id}:`, error);
      }
    }

    this.logger.log(`Initialized ${activeMonitors.length} monitor schedules`);
  }
}
