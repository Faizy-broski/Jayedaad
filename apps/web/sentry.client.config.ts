// Runs in the browser. Inert unless NEXT_PUBLIC_SENTRY_DSN is actually set —
// no Sentry account exists yet as of this pass, same "absent env var ->
// feature inert" convention as NEXT_PUBLIC_GOOGLE_PLACES_API_KEY. Once a
// real DSN is added to .env, this activates with no further code change.
import * as Sentry from '@sentry/nextjs';

const dsn = process.env.NEXT_PUBLIC_SENTRY_DSN;

if (dsn) {
  Sentry.init({
    dsn,
    environment: process.env.NODE_ENV,
    tracesSampleRate: 0.1,
  });
}
