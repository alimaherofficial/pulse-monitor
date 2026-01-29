import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import TelegramBot from 'node-telegram-bot-api';
import { AlertContext, AlertResult, TelegramAlertConfig } from './interfaces/alert.interface';

@Injectable()
export class TelegramService implements OnModuleInit {
  private readonly logger = new Logger(TelegramService.name);
  private bot: TelegramBot | null = null;
  private defaultBotToken: string | undefined;

  constructor(private readonly configService: ConfigService) {}

  onModuleInit(): void {
    this.defaultBotToken = this.configService.get<string>('TELEGRAM_BOT_TOKEN');
    
    if (this.defaultBotToken) {
      try {
        this.bot = new TelegramBot(this.defaultBotToken, { polling: false });
        this.logger.log('Telegram bot initialized');
      } catch (error) {
        this.logger.error('Failed to initialize Telegram bot:', error);
      }
    } else {
      this.logger.warn('TELEGRAM_BOT_TOKEN not configured, Telegram alerts will be disabled');
    }
  }

  async sendAlert(
    config: TelegramAlertConfig,
    context: AlertContext,
    isRecovery = false,
  ): Promise<AlertResult> {
    if (!this.bot && !config.botToken) {
      return {
        success: false,
        error: 'Telegram bot not configured',
      };
    }

    const bot = config.botToken ? new TelegramBot(config.botToken, { polling: false }) : this.bot;
    
    if (!bot) {
      return {
        success: false,
        error: 'Telegram bot not available',
      };
    }

    const message = this.formatMessage(context, isRecovery);

    try {
      await bot.sendMessage(config.chatId, message, {
        parse_mode: 'Markdown',
        disable_web_page_preview: true,
      });

      this.logger.debug(`Telegram alert sent to ${config.chatId} for monitor ${context.monitorId}`);
      
      return { success: true };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(`Failed to send Telegram alert: ${errorMessage}`);
      
      return {
        success: false,
        error: errorMessage,
      };
    }
  }

  private formatMessage(context: AlertContext, isRecovery: boolean): string {
    const statusEmoji = isRecovery ? '✅' : '🔴';
    const title = isRecovery ? 'RECOVERED' : 'ALERT';
    const statusText = isRecovery ? 'UP' : 'DOWN';

    let message = `${statusEmoji} *Pulse Monitor ${title}*\n\n`;
    message += `*Monitor:* ${context.monitorName}\n`;
    message += `*Type:* ${context.monitorType.toUpperCase()}\n`;
    message += `*Status:* ${statusText}\n`;

    if (context.errorMessage && !isRecovery) {
      message += `*Error:* \`${context.errorMessage}\`\n`;
    }

    if (context.responseTime && context.responseTime > 0) {
      message += `*Response Time:* ${context.responseTime}ms\n`;
    }

    if (context.checkUrl) {
      message += `*URL:* ${context.checkUrl}\n`;
    }

    message += `*Time:* ${context.timestamp.toLocaleString()}\n`;
    message += `\n_Pulse Monitor - Keep your services healthy 💗_`;

    return message;
  }

  // For testing connection
  async testConnection(chatId: string, botToken?: string): Promise<AlertResult> {
    const bot = botToken ? new TelegramBot(botToken, { polling: false }) : this.bot;
    
    if (!bot) {
      return {
        success: false,
        error: 'Telegram bot not configured',
      };
    }

    try {
      await bot.sendMessage(
        chatId,
        '✅ *Pulse Monitor Test*\n\nYour Telegram alerts are configured correctly!\n\n_Pulse Monitor 💗_',
        { parse_mode: 'Markdown' },
      );
      return { success: true };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      return { success: false, error: errorMessage };
    }
  }
}
