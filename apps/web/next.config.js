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
    ],
  },
};

module.exports = nextConfig;
