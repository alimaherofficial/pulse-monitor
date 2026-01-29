import { Module } from '@nestjs/common';
import { StatusPagesController, PublicStatusPagesController } from './status-pages.controller';
import { StatusPagesService } from './status-pages.service';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [StatusPagesController, PublicStatusPagesController],
  providers: [StatusPagesService],
  exports: [StatusPagesService],
})
export class StatusPagesModule {}
