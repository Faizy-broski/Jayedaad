# syntax=docker/dockerfile:1
#
# pnpm workspace — this MUST be built with the REPO ROOT as build context:
#   docker build -f apps/web/Dockerfile -t jayedaad-web \
#     --build-arg NEXT_PUBLIC_API_BASE_URL=https://api.example.com \
#     --build-arg NEXT_PUBLIC_SUPABASE_URL=... \
#     --build-arg NEXT_PUBLIC_SUPABASE_ANON_KEY=... \
#     --build-arg NEXT_PUBLIC_GOOGLE_PLACES_API_KEY=... \
#     .
# NEXT_PUBLIC_* vars are inlined into the client bundle at BUILD time, not
# read at container runtime — they must be passed as --build-arg (or via
# docker-compose.yml's build.args), a plain runtime -e/.env won't work.

FROM node:20-alpine AS base
RUN corepack enable

FROM base AS build
WORKDIR /repo
COPY . .
RUN pnpm install --frozen-lockfile

ARG NEXT_PUBLIC_API_BASE_URL
ARG NEXT_PUBLIC_SUPABASE_URL
ARG NEXT_PUBLIC_SUPABASE_ANON_KEY
ARG NEXT_PUBLIC_GOOGLE_PLACES_API_KEY
ENV NEXT_PUBLIC_API_BASE_URL=$NEXT_PUBLIC_API_BASE_URL \
    NEXT_PUBLIC_SUPABASE_URL=$NEXT_PUBLIC_SUPABASE_URL \
    NEXT_PUBLIC_SUPABASE_ANON_KEY=$NEXT_PUBLIC_SUPABASE_ANON_KEY \
    NEXT_PUBLIC_GOOGLE_PLACES_API_KEY=$NEXT_PUBLIC_GOOGLE_PLACES_API_KEY

RUN pnpm --filter @jayedaad/web build

# next.config.js's output: 'standalone' produces a self-contained, pruned
# server + node_modules with no pnpm symlinks (unlike services/api's build)
# — so unlike that Dockerfile, this one can safely cherry-pick just what's
# needed, for a genuinely small final image. Static assets and /public
# aren't included in the standalone output automatically and must be copied
# alongside it.
FROM base AS runner
ENV NODE_ENV=production PORT=3000
WORKDIR /repo
COPY --from=build /repo/apps/web/.next/standalone ./
COPY --from=build /repo/apps/web/.next/static ./apps/web/.next/static
COPY --from=build /repo/apps/web/public ./apps/web/public
EXPOSE 3000
CMD ["node", "apps/web/server.js"]
