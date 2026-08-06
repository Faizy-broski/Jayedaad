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
  images: {
    remotePatterns: supabaseHostname
      ? [{ protocol: 'https', hostname: supabaseHostname, pathname: '/storage/v1/object/public/**' }]
      : [],
  },
};

module.exports = nextConfig;
