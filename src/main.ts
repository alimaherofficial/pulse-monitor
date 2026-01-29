import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';
import { CheckSchedulerService } from './modules/queue/check-scheduler.service';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Enable CORS
  app.enableCors({
    origin: process.env.APP_URL || 'http://localhost:3000',
    credentials: true,
  });

  // Global validation pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  // Initialize monitor schedules on startup
  const checkScheduler = app.get(CheckSchedulerService);
  await checkScheduler.initializeSchedules();

  const port = process.env.PORT ?? 3000;
  await app.listen(port);

  console.log(`🚀 Pulse Monitor API running on port ${port}`);
}

bootstrap();
