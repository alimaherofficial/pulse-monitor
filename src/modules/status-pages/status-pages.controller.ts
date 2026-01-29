import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  UseGuards,
  HttpCode,
  HttpStatus,
  ValidationPipe,
} from '@nestjs/common';
import { StatusPagesService } from './status-pages.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { CreateStatusPageDto } from './dto/create-status-page.dto';
import { UpdateStatusPageDto } from './dto/update-status-page.dto';

@Controller('status-pages')
@UseGuards(JwtAuthGuard)
export class StatusPagesController {
  constructor(private readonly statusPagesService: StatusPagesService) {}

  @Post()
  async create(
    @CurrentUser('id') userId: string,
    @Body(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true }))
    createDto: CreateStatusPageDto,
  ) {
    return this.statusPagesService.create(userId, createDto);
  }

  @Get()
  async findAll(@CurrentUser('id') userId: string) {
    return this.statusPagesService.findAll(userId);
  }

  @Get(':id')
  async findOne(
    @CurrentUser('id') userId: string,
    @Param('id') id: string,
  ) {
    return this.statusPagesService.findOne(userId, id);
  }

  @Patch(':id')
  async update(
    @CurrentUser('id') userId: string,
    @Param('id') id: string,
    @Body(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true }))
    updateDto: UpdateStatusPageDto,
  ) {
    return this.statusPagesService.update(userId, id, updateDto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(
    @CurrentUser('id') userId: string,
    @Param('id') id: string,
  ) {
    await this.statusPagesService.remove(userId, id);
  }
}

// Public endpoint for viewing status pages
@Controller('status')
export class PublicStatusPagesController {
  constructor(private readonly statusPagesService: StatusPagesService) {}

  @Get(':slug')
  async findBySlug(@Param('slug') slug: string) {
    return this.statusPagesService.findBySlug(slug);
  }
}
