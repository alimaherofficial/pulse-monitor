import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
  ValidationPipe,
} from '@nestjs/common';
import { MonitorsService, MonitorWithStats } from './monitors.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { CreateMonitorDto } from './dto/create-monitor.dto';
import { UpdateMonitorDto } from './dto/update-monitor.dto';
import { ListChecksDto } from './dto/list-checks.dto';
import { TestMonitorDto } from './dto/test-monitor.dto';

@Controller('monitors')
@UseGuards(JwtAuthGuard)
export class MonitorsController {
  constructor(private readonly monitorsService: MonitorsService) {}

  @Post()
  async create(
    @CurrentUser('id') userId: string,
    @Body(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true }))
    createMonitorDto: CreateMonitorDto,
  ) {
    return this.monitorsService.create(userId, createMonitorDto);
  }

  @Get()
  async findAll(@CurrentUser('id') userId: string): Promise<MonitorWithStats[]> {
    return this.monitorsService.findAll(userId);
  }

  @Get(':id')
  async findOne(
    @CurrentUser('id') userId: string,
    @Param('id') id: string,
  ): Promise<MonitorWithStats> {
    return this.monitorsService.findOne(userId, id);
  }

  @Patch(':id')
  async update(
    @CurrentUser('id') userId: string,
    @Param('id') id: string,
    @Body(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true }))
    updateMonitorDto: UpdateMonitorDto,
  ) {
    return this.monitorsService.update(userId, id, updateMonitorDto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(
    @CurrentUser('id') userId: string,
    @Param('id') id: string,
  ) {
    await this.monitorsService.remove(userId, id);
  }

  @Post(':id/pause')
  @HttpCode(HttpStatus.OK)
  async pause(
    @CurrentUser('id') userId: string,
    @Param('id') id: string,
  ) {
    return this.monitorsService.pause(userId, id);
  }

  @Post(':id/resume')
  @HttpCode(HttpStatus.OK)
  async resume(
    @CurrentUser('id') userId: string,
    @Param('id') id: string,
  ) {
    return this.monitorsService.resume(userId, id);
  }

  @Get(':id/checks')
  async findChecks(
    @CurrentUser('id') userId: string,
    @Param('id') id: string,
    @Query(new ValidationPipe({ transform: true })) query: ListChecksDto,
  ) {
    return this.monitorsService.findChecks(userId, id, query);
  }

  @Get(':id/incidents')
  async findIncidents(
    @CurrentUser('id') userId: string,
    @Param('id') id: string,
    @Query(new ValidationPipe({ transform: true })) query: ListChecksDto,
  ) {
    return this.monitorsService.findIncidents(userId, id, query);
  }

  @Post('test')
  async testMonitor(
    @Body(new ValidationPipe({ whitelist: true })) testDto: TestMonitorDto,
  ) {
    return this.monitorsService.testMonitor(testDto);
  }
}
