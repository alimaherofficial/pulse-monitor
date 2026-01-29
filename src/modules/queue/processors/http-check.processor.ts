import { Processor, WorkerHost, OnWorkerEvent } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { Job } from 'bullmq';
import { CheckStatus, Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { HttpCheckService } from '../../http-check/http-check.service';
import { AlertsService } from '../../alerts/alerts.service';
import { QUEUE_NAMES, JOB_NAMES } from '../interfaces/queue.interface';
import { HttpCheckConfig } from '../../http-check/interfaces/http-check.interface';
import { AlertContext } from '../../alerts/interfaces/alert.interface';

@Processor(QUEUE_NAMES.HTTP_CHECKS)
export class HttpCheckProcessor extends WorkerHost {
  private readonly logger = new Logger(HttpCheckProcessor.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly httpCheckService: HttpCheckService,
    private readonly alertsService: AlertsService,
  ) {
    super();
  }

  async process(job: Job<any>): Promise<void> {
    if (job.name !== JOB_NAMES.HTTP_CHECK) {
      return;
    }

    const { monitorId, userId } = job.data;
    
    this.logger.debug(`Processing HTTP check for monitor ${monitorId}`);

    // Get monitor details
    const monitor = await this.prisma.monitor.findUnique({
      where: { id: monitorId },
      include: {
        alertChannels: true,
      },
    });

    if (!monitor) {
      this.logger.error(`Monitor ${monitorId} not found`);
      return;
    }

    if (monitor.isPaused) {
      this.logger.debug(`Monitor ${monitorId} is paused, skipping check`);
      return;
    }

    // Parse config
    const config = monitor.config as Prisma.JsonObject;
    const checkConfig: HttpCheckConfig = {
      url: config.url as string,
      method: (config.method as 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH') || 'GET',
      headers: (config.headers as Record<string, string>) || {},
      body: config.body as string,
      expectedStatusCodes: (config.expectedStatusCodes as number[]) || [200],
      expectedKeyword: config.expectedKeyword as string,
      timeoutMs: (config.timeoutMs as number) || 30000,
      followRedirects: config.followRedirects as boolean,
      validateSSL: config.validateSSL !== false,
    };

    // Perform the check
    const result = await this.httpCheckService.performCheck(checkConfig);

    // Save the result
    const checkResult = await this.prisma.checkResult.create({
      data: {
        monitorId,
        status: result.status as CheckStatus,
        responseTime: result.responseTime,
        httpStatusCode: result.httpStatusCode,
        errorMessage: result.errorMessage,
        checkedAt: result.timestamp,
      },
    });

    this.logger.debug(
      `Check result for monitor ${monitorId}: ${result.status} (${result.responseTime}ms)`,
    );

    // Handle status changes and alerts
    await this.handleStatusChange(monitor, result.status as CheckStatus, result.errorMessage, checkConfig.url);
  }

  private async handleStatusChange(
    monitor: any,
    newStatus: CheckStatus,
    errorMessage?: string,
    checkUrl?: string,
  ): Promise<void> {
    // Get the last check result (excluding the one we just created)
    const lastCheck = await this.prisma.checkResult.findFirst({
      where: {
        monitorId: monitor.id,
      },
      orderBy: {
        checkedAt: 'desc',
      },
      skip: 1,
    });

    const previousStatus = lastCheck?.status;

    // If status changed, handle accordingly
    if (previousStatus !== newStatus) {
      this.logger.log(
        `Monitor ${monitor.id} status changed from ${previousStatus} to ${newStatus}`,
      );

      if (newStatus === CheckStatus.down) {
        // Create incident
        await this.prisma.incident.create({
          data: {
            monitorId: monitor.id,
            startedAt: new Date(),
            errorMessage,
          },
        });
        
        // Trigger alert
        const alertContext: AlertContext = {
          monitorId: monitor.id,
          monitorName: monitor.name,
          monitorType: monitor.type,
          status: newStatus,
          previousStatus,
          errorMessage,
          timestamp: new Date(),
          checkUrl,
        };
        await this.alertsService.sendAlert(alertContext);
        
        this.logger.log(`Monitor ${monitor.id} is DOWN - incident and alert created`);
      } else if (newStatus === CheckStatus.up && previousStatus === CheckStatus.down) {
        // Resolve incident
        const unresolvedIncident = await this.prisma.incident.findFirst({
          where: {
            monitorId: monitor.id,
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
            status: newStatus,
            previousStatus,
            timestamp: new Date(),
            checkUrl,
          };
          await this.alertsService.sendAlert(alertContext);
          
          this.logger.log(`Monitor ${monitor.id} is UP - incident resolved and recovery alert sent`);
        }
      }
    }
  }

  @OnWorkerEvent('failed')
  onFailed(job: Job<any>, error: Error): void {
    this.logger.error(
      `Job ${job.id} for monitor ${job.data.monitorId} failed:`,
      error.stack,
    );
  }

  @OnWorkerEvent('completed')
  onCompleted(job: Job<any>): void {
    this.logger.debug(`Job ${job.id} for monitor ${job.data.monitorId} completed`);
  }
}
