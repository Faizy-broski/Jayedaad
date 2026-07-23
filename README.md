# Jayedaad Monorepo

Verified real-estate marketplace — Web (Next.js), Mobile (Expo/React Native), and a unified NestJS API backed by Supabase (Postgres + Auth), per `Jayedaad_Architectural_Blueprint.md`.

## Structure

```
apps/web        Next.js web app (buyer/owner-facing + agent/admin portals)
apps/mobile     Expo React Native app (feature parity with web)
packages/core   Shared models, viewmodels (hooks), API repositories, state, Supabase client
packages/ui-web     Web presentational components
packages/ui-native  React Native presentational components
services/api    NestJS API — single REST source of truth, reads/writes Supabase Postgres via @supabase/supabase-js
supabase/migrations  SQL schema + RPC functions + RLS policies, applied via the Supabase CLI
```

## Prerequisites

- Node.js >= 20 (managed via `nvm`; run `nvm use` in this directory)
- pnpm (via corepack: `corepack enable && corepack prepare pnpm@latest --activate`)
- A Supabase project (Postgres + Auth are both hosted there — no local Postgres needed)
- Docker only for local Redis (caching / real-time counters)

## First-time setup

```bash
cp .env.example .env                    # fill in your Supabase project's URL/keys
cp .env.example services/api/.env
pnpm install
docker compose up -d                    # starts Redis
```

Apply the schema to your Supabase project (via the Supabase CLI, once linked to your project):

```bash
supabase link --project-ref <your-project-ref>
supabase db push                        # applies supabase/migrations/*.sql in order
```

## Running everything

```bash
pnpm dev   # runs api, web, and mobile dev servers concurrently via Turborepo
```

Or individually:

```bash
pnpm --filter services/api start:dev    # http://localhost:3001
pnpm --filter apps/web dev              # http://localhost:3000
pnpm --filter apps/mobile start         # Expo dev server / QR code
```

## Auth

Identity is handled entirely by **Supabase Auth**, called directly from `apps/web`/`apps/mobile` via the shared `@jayedaad/core` Supabase client (`configureSupabaseClient()` in each app's entry point). The NestJS API never issues tokens — `JwtAuthGuard` (`services/api/src/auth/jwt-auth.guard.ts`) only verifies Supabase-issued JWTs against `SUPABASE_JWT_SECRET`, reading role/agentId from the token's `app_metadata` claim.

## Verifying the RBAC scoping pattern

```bash
curl http://localhost:3001/health
curl http://localhost:3001/listings          # public — verified-only, no auth required
curl http://localhost:3001/crm/leads          # should 401 without a valid Supabase-issued JWT
```

## Architecture reference

See `Jayedaad_Architectural_Blueprint.md` at the repo root for the full rationale behind every architectural decision (infra topology, RBAC/scoping model, CRM performance targets, verification audit trail, chatbot role-awareness, CI/CD, and the 8-week execution roadmap).
