import { AlertType, CheckStatus } from '@prisma/client';

export interface AlertConfig {
  type: AlertType;
  config: Record<string, any>;
}

export interface TelegramAlertConfig {
  chatId: string;
  botToken?: string; // Optional, falls back to default bot
}

export interface AlertContext {
  monitorId: string;
  monitorName: string;
  monitorType: string;
  status: CheckStatus;
  previousStatus?: CheckStatus;
  errorMessage?: string;
  responseTime?: number;
  timestamp: Date;
  checkUrl?: string;
}

export interface AlertResult {
  success: boolean;
  error?: string;
}

// Alert throttling configuration
export const ALERT_THROTTLE_MINUTES = 15;
