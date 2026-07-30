# syntax=docker/dockerfile:1
#
# pnpm workspace — this MUST be built with the REPO ROOT as build context
# (not services/api), since it needs packages/core, the root lockfile, etc.:
#   docker build -f services/api/Dockerfile -t jayedaad-api .
# (run from the repo root; docker-compose.yml is already set up this way)

FROM node:20-alpine AS base
RUN corepack enable

FROM base AS build
WORKDIR /repo
COPY . .
RUN pnpm install --frozen-lockfile
RUN pnpm --filter @jayedaad/api build

# Runtime stage copies the whole built workspace (source + full node_modules,
# including pnpm's .pnpm symlink store) rather than cherry-picking individual
# package.json/node_modules dirs — pnpm's node_modules layout is symlink-
# heavy, and copying a subset risks broken links / "module not found" at
# runtime. Trades image size for guaranteed-correct module resolution;
# slimming this via `pnpm deploy`/production-only pruning is a reasonable
# later optimization once the basic deploy is proven working.
FROM base AS runner
ENV NODE_ENV=production
WORKDIR /repo
COPY --from=build /repo ./
EXPOSE 3001
CMD ["node", "services/api/dist/main.js"]
