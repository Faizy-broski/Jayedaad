import 'dotenv/config';
import 'reflect-metadata';
import * as Sentry from '@sentry/node';
import { NestFactory } from '@nestjs/core';
import { Logger, ValidationPipe } from '@nestjs/common';
import helmet from 'helmet';
import { AppModule } from './app.module';
import { AllExceptionsFilter } from './common/filters/all-exceptions.filter';

// Inert unless SENTRY_DSN is actually set — no account exists yet as of this
// pass, so this is wired but dormant until a real DSN is added to .env, same
// "absent env var -> feature inert" convention as
// NEXT_PUBLIC_GOOGLE_PLACES_API_KEY. Must run before NestFactory.create so
// framework-level startup errors are captured too.
if (process.env.SENTRY_DSN) {
  Sentry.init({ dsn: process.env.SENTRY_DSN, environment: process.env.NODE_ENV ?? 'development' });
}

async function bootstrap() {
  const logger = new Logger('Bootstrap');
  // rawBody: true makes the exact request bytes available via req.rawBody
  // on every route, alongside Nest's normal parsed req.body — needed only
  // by the Stripe webhook route (subscriptions.controller.ts), whose
  // signature check hashes the raw bytes, not the parsed/reserialized JSON.
  const app = await NestFactory.create(AppModule, { rawBody: true });
  // Docker/orchestrators send SIGTERM on every redeploy — without this,
  // in-flight requests get dropped mid-request (a 502) instead of finishing
  // before the process exits.
  app.enableShutdownHooks();
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
  // Explicit 0.0.0.0 (not just the implicit default) — required to be
  // reachable from outside a Docker container, where "localhost" inside the
  // container isn't the host's localhost.
  await app.listen(port, '0.0.0.0');
  logger.log(`Jayedaad API listening on http://0.0.0.0:${port}`);
}

bootstrap();
