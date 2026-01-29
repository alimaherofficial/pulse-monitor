import {
  IsString,
  IsEnum,
  IsOptional,
  IsInt,
  Min,
  Max,
  IsJSON,
  ValidateNested,
  IsUrl,
  IsObject,
  IsBoolean,
} from 'class-validator';
import { Type } from 'class-transformer';
import { MonitorType } from '@prisma/client';

class HttpMonitorConfigDto {
  @IsUrl()
  url: string;

  @IsOptional()
  @IsEnum(['GET', 'POST', 'PUT', 'DELETE', 'PATCH'])
  method?: string;

  @IsOptional()
  @IsObject()
  headers?: Record<string, string>;

  @IsOptional()
  @IsString()
  body?: string;

  @IsOptional()
  expectedStatusCodes?: number[];

  @IsOptional()
  @IsString()
  expectedKeyword?: string;

  @IsOptional()
  @IsInt()
  @Min(1000)
  @Max(60000)
  timeoutMs?: number;

  @IsOptional()
  @IsBoolean()
  followRedirects?: boolean;

  @IsOptional()
  @IsBoolean()
  validateSSL?: boolean;
}

class CronMonitorConfigDto {
  @IsInt()
  @Min(1)
  @Max(10080) // Max 1 week in minutes
  expectedIntervalMinutes: number;
}

class SslMonitorConfigDto {
  @IsUrl()
  url: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(90)
  alertDaysBeforeExpiry?: number[];
}

export class CreateMonitorDto {
  @IsString()
  name: string;

  @IsEnum(MonitorType)
  type: MonitorType;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(1440) // Max 24 hours in minutes
  interval?: number; // For HTTP monitors (in minutes)

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(1440)
  gracePeriod?: number; // For Cron monitors (in minutes)

  @IsOptional()
  @IsObject()
  config?: HttpMonitorConfigDto | CronMonitorConfigDto | SslMonitorConfigDto | Record<string, any>;
}
