import 'dotenv/config';
import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { Logger, ValidationPipe } from '@nestjs/common';
import helmet from 'helmet';
import { AppModule } from './app.module';
import { AllExceptionsFilter } from './common/filters/all-exceptions.filter';

async function bootstrap() {
  const logger = new Logger('Bootstrap');
  const app = await NestFactory.create(AppModule);
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
  app.useGlobalFilters(new AllExceptionsFilter());
  app.use(helmet());

  // Mobile isn't subject to CORS (native fetch, no browser Origin
  // enforcement) — this allow-list is only relevant to apps/web. Falls back
  // to localhost:3000 so local dev keeps working if CORS_ALLOWED_ORIGINS
  // isn't set yet, but warns since that fallback is dev-only, never prod-safe.
  const allowedOrigins = process.env.CORS_ALLOWED_ORIGINS?.split(',').map((origin) => origin.trim());
  if (!allowedOrigins) {
    logger.warn('CORS_ALLOWED_ORIGINS not set — defaulting to http://localhost:3000 (dev only, not safe for prod)');
  }
  app.enableCors({ origin: allowedOrigins ?? ['http://localhost:3000'] });

  const port = process.env.PORT ? Number(process.env.PORT) : 3001;
  await app.listen(port);
  logger.log(`Jayedaad API listening on http://localhost:${port}`);
}

bootstrap();
