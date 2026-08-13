const { withSentryConfig } = require('@sentry/nextjs');

// Derived from the env var (not hardcoded) so this doesn't silently rot if
// the Supabase project ref ever changes — every Storage-hosted image
// (listing photos, agency/agent avatars, blog covers, ...) is served from
// this same host, and next/image refuses to render any remote src whose
// host isn't explicitly allow-listed here.
const supabaseHostname = process.env.NEXT_PUBLIC_SUPABASE_URL
  ? new URL(process.env.NEXT_PUBLIC_SUPABASE_URL).hostname
  : undefined;

/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ['@jayedaad/core', '@jayedaad/ui-web'],
  reactStrictMode: true,
  // Traced, pruned server bundle for Docker (services/api/Dockerfile's web
  // counterpart) — without this, a Next Docker image ships the entire
  // node_modules tree instead of just what's actually used at runtime.
  // No effect on Vercel (which does its own equivalent tracing already).
  output: 'standalone',
  // Real listing media now renders on the homepage (Featured/Newly Staged
  // sections fetch from GET /listings) — photos live in Supabase Storage,
  // and seed data (supabase/seed/sample_listings.sql) uses picsum.photos.
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: '*.supabase.co' },
      { protocol: 'https', hostname: 'picsum.photos' },
      // Testimonials section (data/testimonials.ts) uses curated Unsplash
      // portraits instead of local files that were never actually added.
      { protocol: 'https', hostname: 'images.unsplash.com' },
    ],
  },
  // Every prefix middleware.ts's PROTECTED_ROUTES gates — without this, the
  // browser is free to bfcache a rendered protected page (e.g. /dashboard).
  // middleware.ts's auth check only runs on a real network request, never
  // on a bfcache restore, so pressing Back after logout could show a frozen
  // snapshot of the page from before signOut() cleared the session cookie —
  // cosmetically alarming (looks "still logged in") even though any real
  // interaction/data fetch on that stale page would fail. no-store stops
  // the browser from caching these responses at all, so Back always forces
  // a fresh request that middleware actually sees.
  async headers() {
    const protectedPrefixes = [
      '/verification',
      '/crm',
      '/submit',
      '/calendar',
      '/dashboard',
      '/property-management',
      '/projects',
      '/agent-settings',
      '/plan',
      '/admin',
      '/become-an-agent',
      '/agent-verification',
      '/agency-staff',
      '/account',
    ];
    return protectedPrefixes.map((prefix) => ({
      source: `${prefix}/:path*`,
      headers: [{ key: 'Cache-Control', value: 'no-store' }],
    }));
  },
};

// withSentryConfig only affects the build (source map upload, tunnel route)
// and is itself a no-op without SENTRY_AUTH_TOKEN — safe to wrap
// unconditionally, matches sentry.*.config.ts's own DSN-gated init.
module.exports = withSentryConfig(nextConfig, {
  silent: true,
  org: process.env.SENTRY_ORG,
  project: process.env.SENTRY_PROJECT,
  // Source map upload needs SENTRY_AUTH_TOKEN — unset today (no Sentry
  // account yet), so this step is skipped at build time until it's added.
  disableLogger: true,
  automaticVercelMonitors: false,
});
