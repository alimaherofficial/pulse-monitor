import { Controller, Get, UseGuards } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { MonitorStatus, IncidentStatus } from '@prisma/client';

@Controller('dashboard')
@UseGuards(JwtAuthGuard)
export class DashboardController {
  constructor(private readonly prisma: PrismaService) {}

  @Get('stats')
  async getStats(@CurrentUser('id') userId: string) {
    const [
      totalMonitors,
      upMonitors,
      downMonitors,
      pausedMonitors,
      totalIncidents,
      activeIncidents,
    ] = await Promise.all([
      this.prisma.monitor.count({ where: { userId } }),
      this.prisma.monitor.count({ 
        where: { 
          userId, 
          status: MonitorStatus.up,
          isPaused: false,
        } 
      }),
      this.prisma.monitor.count({ 
        where: { 
          userId, 
          status: MonitorStatus.down,
          isPaused: false,
        } 
      }),
      this.prisma.monitor.count({ 
        where: { 
          userId, 
          isPaused: true,
        } 
      }),
      this.prisma.incident.count({
        where: {
          monitor: { userId },
        },
      }),
      this.prisma.incident.count({
        where: {
          monitor: { userId },
          status: { not: IncidentStatus.resolved },
        },
      }),
    ]);

    return {
      totalMonitors,
      upMonitors,
      downMonitors,
      pausedMonitors,
      totalIncidents,
      activeIncidents,
    };
  }
}
