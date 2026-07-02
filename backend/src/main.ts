import { Logger, ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { static as expressStatic } from 'express';
import * as Sentry from '@sentry/node';
import { join } from 'path';
import { AppModule } from './app.module';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';
import { RequestLoggingInterceptor } from './common/interceptors/request-logging.interceptor';

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(AppModule);
  const config = app.get(ConfigService);
  const logger = new Logger('Bootstrap');
  const sentryDsn = config.get<string>('SENTRY_DSN');

  if (sentryDsn) {
    Sentry.init({
      dsn: sentryDsn,
      environment: config.get<string>('NODE_ENV', 'development')
    });
  }

  const corsOrigins = config
    .get<string>('CORS_ORIGINS', '')
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);

  app.enableCors({
    origin: corsOrigins.length > 0 ? corsOrigins : false,
    credentials: true
  });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true
    })
  );
  app.useGlobalFilters(new HttpExceptionFilter());
  app.useGlobalInterceptors(new RequestLoggingInterceptor());
  app.use('/uploads', expressStatic(join(process.cwd(), 'uploads')));

  const port = config.get<number>('PORT', 3000);
  await app.listen(port);
  logger.log(`Backend listening on port ${port}`);
}

void bootstrap();
