import { Controller, Get, UseGuards } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@Controller('dashboard')
@UseGuards(JwtAuthGuard)
export class DashboardController {
  constructor(private readonly prisma: PrismaService) {}

  @Get('stats')
  async getStats(@CurrentUser('id') userId: string) {
    const [
      totalMonitors,
      pausedMonitors,
      totalIncidents,
      activeIncidents,
    ] = await Promise.all([
      this.prisma.monitor.count({ where: { userId } }),
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
          resolvedAt: null,
        },
      }),
    ]);

    // Get monitors with latest check status
    const monitors = await this.prisma.monitor.findMany({
      where: { userId },
      include: {
        checkResults: {
          orderBy: { checkedAt: 'desc' },
          take: 1,
          select: { status: true },
        },
      },
    });

    const upMonitors = monitors.filter(m => !m.isPaused && m.checkResults[0]?.status === 'up').length;
    const downMonitors = monitors.filter(m => !m.isPaused && m.checkResults[0]?.status === 'down').length;

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
