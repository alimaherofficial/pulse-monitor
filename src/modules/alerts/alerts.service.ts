import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { TelegramService } from './telegram.service';
import {
  AlertContext,
  AlertResult,
  TelegramAlertConfig,
  ALERT_THROTTLE_MINUTES,
} from './interfaces/alert.interface';
import { AlertType, CheckStatus, Prisma } from '@prisma/client';

interface AlertThrottleRecord {
  lastAlertAt: Date;
  alertCount: number;
}

@Injectable()
export class AlertsService {
  private readonly logger = new Logger(AlertsService.name);
  private throttleCache: Map<string, AlertThrottleRecord> = new Map();

  constructor(
    private readonly prisma: PrismaService,
    private readonly telegramService: TelegramService,
  ) {}

  async sendAlert(context: AlertContext): Promise<void> {
    const { monitorId, status, previousStatus } = context;

    // Get alert channels for this monitor
    const alertChannels = await this.prisma.alertChannel.findMany({
      where: {
        monitorId,
        isActive: true,
      },
    });

    if (alertChannels.length === 0) {
      this.logger.debug(`No active alert channels for monitor ${monitorId}`);
      return;
    }

    // Determine if this is a recovery (status changed from down to up)
    const isRecovery = status === CheckStatus.up && previousStatus === CheckStatus.down;

    // Check throttle for down alerts (not recovery)
    if (status === CheckStatus.down && !isRecovery) {
      const isThrottled = this.checkThrottle(monitorId);
      if (isThrottled) {
        this.logger.debug(`Alert throttled for monitor ${monitorId}`);
        return;
      }
    }

    // Get user's telegram chat ID as fallback
    const monitor = await this.prisma.monitor.findUnique({
      where: { id: monitorId },
      include: { user: true },
    });

    const results: AlertResult[] = [];

    for (const channel of alertChannels) {
      const config = channel.config as Prisma.JsonObject;
      
      switch (channel.type) {
        case AlertType.telegram:
          const telegramConfig: TelegramAlertConfig = {
            chatId: config.chatId as string,
            botToken: config.botToken as string | undefined,
          };
          const result = await this.telegramService.sendAlert(
            telegramConfig,
            context,
            isRecovery,
          );
          results.push(result);
          break;

        case AlertType.discord:
          // TODO: Implement Discord webhook
          this.logger.debug('Discord alerts not yet implemented');
          break;

        case AlertType.slack:
          // TODO: Implement Slack webhook
          this.logger.debug('Slack alerts not yet implemented');
          break;

        case AlertType.email:
          // TODO: Implement email alerts
          this.logger.debug('Email alerts not yet implemented');
          break;

        default:
          this.logger.warn(`Unknown alert type: ${channel.type}`);
      }
    }

    // Also send to user's default Telegram if configured and no Telegram channel set up
    const hasTelegramChannel = alertChannels.some((c) => c.type === AlertType.telegram);
    if (!hasTelegramChannel && monitor?.user?.telegramChatId) {
      const userTelegramConfig: TelegramAlertConfig = {
        chatId: monitor.user.telegramChatId,
      };
      const result = await this.telegramService.sendAlert(
        userTelegramConfig,
        context,
        isRecovery,
      );
      results.push(result);
    }

    // Update throttle on successful down alert
    if (status === CheckStatus.down && !isRecovery && results.some((r) => r.success)) {
      this.updateThrottle(monitorId);
    }

    // Log results
    const successCount = results.filter((r) => r.success).length;
    const failCount = results.length - successCount;
    this.logger.log(
      `Alert sent for monitor ${monitorId}: ${successCount} successful, ${failCount} failed`,
    );
  }

  private checkThrottle(monitorId: string): boolean {
    const record = this.throttleCache.get(monitorId);
    
    if (!record) {
      return false;
    }

    const now = new Date();
    const throttleWindow = ALERT_THROTTLE_MINUTES * 60 * 1000; // Convert to milliseconds
    const timeSinceLastAlert = now.getTime() - record.lastAlertAt.getTime();

    return timeSinceLastAlert < throttleWindow;
  }

  private updateThrottle(monitorId: string): void {
    const existing = this.throttleCache.get(monitorId);
    
    this.throttleCache.set(monitorId, {
      lastAlertAt: new Date(),
      alertCount: existing ? existing.alertCount + 1 : 1,
    });

    // Clean up old entries periodically (entries older than 24 hours)
    this.cleanupThrottleCache();
  }

  private cleanupThrottleCache(): void {
    const now = new Date();
    const maxAge = 24 * 60 * 60 * 1000; // 24 hours

    for (const [monitorId, record] of this.throttleCache.entries()) {
      if (now.getTime() - record.lastAlertAt.getTime() > maxAge) {
        this.throttleCache.delete(monitorId);
      }
    }
  }

  // For testing Telegram connection
  async testTelegramConnection(chatId: string, botToken?: string): Promise<AlertResult> {
    return this.telegramService.testConnection(chatId, botToken);
  }
}
