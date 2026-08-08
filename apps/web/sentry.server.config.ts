// Runs in the Node.js server runtime (SSR, route handlers). Inert unless
// NEXT_PUBLIC_SENTRY_DSN is set — see sentry.client.config.ts for why the
// var is shared across client/server rather than split.
import * as Sentry from '@sentry/nextjs';

const dsn = process.env.NEXT_PUBLIC_SENTRY_DSN;

if (dsn) {
  Sentry.init({
    dsn,
    environment: process.env.NODE_ENV,
    tracesSampleRate: 0.1,
  });
}
