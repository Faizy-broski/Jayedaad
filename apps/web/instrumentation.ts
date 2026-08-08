// Next.js's instrumentation hook — runs once per server/edge runtime
// startup, before any request. Delegates to the matching Sentry config
// (both inert unless NEXT_PUBLIC_SENTRY_DSN is set — see
// sentry.server.config.ts / sentry.edge.config.ts).
export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    await import('./sentry.server.config');
  }
  if (process.env.NEXT_RUNTIME === 'edge') {
    await import('./sentry.edge.config');
  }
}
