import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { BullModule } from '@nestjs/bullmq';
import { CheckSchedulerService } from './check-scheduler.service';
import { HttpCheckProcessor } from './processors/http-check.processor';
import { CronCheckProcessor } from './processors/cron-check.processor';
import { HttpCheckModule } from '../http-check/http-check.module';
import { PrismaModule } from '../prisma/prisma.module';
import { AlertsModule } from '../alerts/alerts.module';

@Module({
  imports: [
    ConfigModule,
    BullModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        connection: {
          url: configService.get<string>('REDIS_URL'),
        },
        defaultJobOptions: {
          attempts: 3,
          backoff: {
            type: 'exponential',
            delay: 5000,
          },
          removeOnComplete: 100,
          removeOnFail: 50,
        },
      }),
      inject: [ConfigService],
    }),
    BullModule.registerQueue({
      name: 'http-checks',
    }),
    BullModule.registerQueue({
      name: 'cron-checks',
    }),
    HttpCheckModule,
    PrismaModule,
    AlertsModule,
  ],
  providers: [CheckSchedulerService, HttpCheckProcessor, CronCheckProcessor],
  exports: [CheckSchedulerService],
})
export class QueueModule {}
