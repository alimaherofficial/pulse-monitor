export interface CheckJobData {
  monitorId: string;
  userId: string;
}

export interface CronCheckJobData {
  monitorId: string;
  userId: string;
  gracePeriodMinutes: number;
}

export const JOB_NAMES = {
  HTTP_CHECK: 'http-check',
  CRON_CHECK: 'cron-check',
} as const;

export const QUEUE_NAMES = {
  HTTP_CHECKS: 'http-checks',
  CRON_CHECKS: 'cron-checks',
} as const;
