import { Module } from '@nestjs/common';
import { MonitorsController } from './monitors.controller';
import { CronHeartbeatController } from './cron-heartbeat.controller';
import { MonitorsService } from './monitors.service';
import { QueueModule } from '../queue/queue.module';

@Module({
  imports: [QueueModule],
  controllers: [MonitorsController, CronHeartbeatController],
  providers: [MonitorsService],
  exports: [MonitorsService],
})
export class MonitorsModule {}
