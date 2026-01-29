import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from './modules/prisma/prisma.module';
import { AuthModule } from './modules/auth/auth.module';
import { MonitorsModule } from './modules/monitors/monitors.module';
import { QueueModule } from './modules/queue/queue.module';
import { AlertsModule } from './modules/alerts/alerts.module';
import { HttpCheckModule } from './modules/http-check/http-check.module';
import { DashboardModule } from './modules/dashboard/dashboard.module';
import { StatusPagesModule } from './modules/status-pages/status-pages.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    PrismaModule,
    AuthModule,
    MonitorsModule,
    QueueModule,
    AlertsModule,
    HttpCheckModule,
    DashboardModule,
    StatusPagesModule,
  ],
})
export class AppModule {}
