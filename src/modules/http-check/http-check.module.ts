import { Module } from '@nestjs/common';
import { HttpCheckService } from './http-check.service';

@Module({
  providers: [HttpCheckService],
  exports: [HttpCheckService],
})
export class HttpCheckModule {}
