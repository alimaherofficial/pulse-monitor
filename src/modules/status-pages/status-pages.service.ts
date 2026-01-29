import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateStatusPageDto } from './dto/create-status-page.dto';
import { UpdateStatusPageDto } from './dto/update-status-page.dto';

@Injectable()
export class StatusPagesService {
  constructor(private readonly prisma: PrismaService) {}

  async create(userId: string, createDto: CreateStatusPageDto) {
    // Check if slug is already taken
    const existing = await this.prisma.statusPage.findUnique({
      where: { slug: createDto.slug },
    });

    if (existing) {
      throw new ConflictException('Slug is already taken');
    }

    // Validate that all monitors belong to the user
    if (createDto.monitorIds && createDto.monitorIds.length > 0) {
      const monitors = await this.prisma.monitor.findMany({
        where: {
          id: { in: createDto.monitorIds },
          userId,
        },
      });

      if (monitors.length !== createDto.monitorIds.length) {
        throw new ForbiddenException('Some monitors do not belong to you');
      }
    }

    const statusPage = await this.prisma.statusPage.create({
      data: {
        slug: createDto.slug,
        title: createDto.title,
        description: createDto.description,
        isPublic: createDto.isPublic ?? true,
        passwordHash: createDto.password || null,
        userId,
        monitors: {
          connect: createDto.monitorIds?.map(id => ({ id })) || [],
        },
      },
      include: {
        monitors: {
          select: {
            id: true,
            name: true,
            type: true,
            isPaused: true,
            createdAt: true,
          },
        },
      },
    });

    return statusPage;
  }

  async findAll(userId: string) {
    return this.prisma.statusPage.findMany({
      where: { userId },
      include: {
        monitors: {
          select: {
            id: true,
            name: true,
            type: true,
            isPaused: true,
            createdAt: true,
          },
        },
        _count: {
          select: { monitors: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(userId: string, id: string) {
    const statusPage = await this.prisma.statusPage.findUnique({
      where: { id },
      include: {
        monitors: true,
      },
    });

    if (!statusPage) {
      throw new NotFoundException('Status page not found');
    }

    if (statusPage.userId !== userId) {
      throw new ForbiddenException('You do not have access to this status page');
    }

    return statusPage;
  }

  async findBySlug(slug: string) {
    const statusPage = await this.prisma.statusPage.findUnique({
      where: { slug },
      include: {
        monitors: {
          select: {
            id: true,
            name: true,
            type: true,
            isPaused: true,
            createdAt: true,
            checkResults: {
              orderBy: { checkedAt: 'desc' },
              take: 1,
              select: {
                status: true,
                checkedAt: true,
              },
            },
          },
        },
      },
    });

    if (!statusPage) {
      throw new NotFoundException('Status page not found');
    }

    if (!statusPage.isPublic) {
      // For now, just return 401 - in production, you'd check the password
      throw new ForbiddenException('This status page is private');
    }

    // Transform monitors to include status
    const monitorsWithStatus = statusPage.monitors.map(monitor => ({
      ...monitor,
      status: monitor.isPaused ? 'PAUSED' : (monitor.checkResults[0]?.status?.toUpperCase() || 'UNKNOWN'),
      lastCheckedAt: monitor.checkResults[0]?.checkedAt || null,
      checkResults: undefined,
    }));

    return {
      ...statusPage,
      monitors: monitorsWithStatus,
    };
  }

  async update(userId: string, id: string, updateDto: UpdateStatusPageDto) {
    const statusPage = await this.prisma.statusPage.findUnique({
      where: { id },
    });

    if (!statusPage) {
      throw new NotFoundException('Status page not found');
    }

    if (statusPage.userId !== userId) {
      throw new ForbiddenException('You do not have access to this status page');
    }

    // Check slug uniqueness if being updated
    if (updateDto.slug && updateDto.slug !== statusPage.slug) {
      const existing = await this.prisma.statusPage.findUnique({
        where: { slug: updateDto.slug },
      });

      if (existing) {
        throw new ConflictException('Slug is already taken');
      }
    }

    // Validate monitors if being updated
    if (updateDto.monitorIds) {
      const monitors = await this.prisma.monitor.findMany({
        where: {
          id: { in: updateDto.monitorIds },
          userId,
        },
      });

      if (monitors.length !== updateDto.monitorIds.length) {
        throw new ForbiddenException('Some monitors do not belong to you');
      }
    }

    const updated = await this.prisma.statusPage.update({
      where: { id },
      data: {
        slug: updateDto.slug,
        title: updateDto.title,
        description: updateDto.description,
        isPublic: updateDto.isPublic,
        passwordHash: updateDto.password,
        monitors: updateDto.monitorIds
          ? { set: updateDto.monitorIds.map(id => ({ id })) }
          : undefined,
      },
      include: {
        monitors: true,
      },
    });

    return updated;
  }

  async remove(userId: string, id: string) {
    const statusPage = await this.prisma.statusPage.findUnique({
      where: { id },
    });

    if (!statusPage) {
      throw new NotFoundException('Status page not found');
    }

    if (statusPage.userId !== userId) {
      throw new ForbiddenException('You do not have access to this status page');
    }

    await this.prisma.statusPage.delete({
      where: { id },
    });
  }
}
