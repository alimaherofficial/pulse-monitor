import { IsString, IsOptional, IsNumber, IsEnum } from 'class-validator';
import { MonitorType } from '@prisma/client';

export class TestMonitorDto {
  @IsString()
  url!: string;

  @IsEnum(MonitorType)
  type!: MonitorType;

  @IsNumber()
  @IsOptional()
  expectedStatusCode?: number;

  @IsString()
  @IsOptional()
  keyword?: string;
}
