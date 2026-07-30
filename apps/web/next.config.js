/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ['@jayedaad/core', '@jayedaad/ui-web'],
  reactStrictMode: true,
  // Traced, pruned server bundle for Docker (services/api/Dockerfile's web
  // counterpart) — without this, a Next Docker image ships the entire
  // node_modules tree instead of just what's actually used at runtime.
  // No effect on Vercel (which does its own equivalent tracing already).
  output: 'standalone',
};

module.exports = nextConfig;
