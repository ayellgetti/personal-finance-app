FROM node:22-alpine
ENV CI=true
RUN corepack enable && corepack prepare pnpm@11.9.0 --activate
WORKDIR /app

# pnpm validates the lockfile against every workspace member, so all manifests
# must be present even though the filter installs only web's dependencies.
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY apps/api/package.json apps/api/
COPY apps/web/package.json apps/web/
COPY apps/website/package.json apps/website/
COPY apps/crm/package.json apps/crm/
COPY packages/tsconfig/package.json packages/tsconfig/
# Docker's path to the npm registry is often slow enough to hit pnpm's 60s
# fetch timeout (error 23) during metadata checks and tarball downloads.
RUN pnpm install --frozen-lockfile --filter web... \
    --fetch-timeout=300000 \
    --fetch-retries=5 \
    --fetch-retry-mintimeout=10000 \
    --fetch-retry-maxtimeout=120000 \
    --network-concurrency=4

COPY apps/web apps/web

WORKDIR /app/apps/web
EXPOSE 8080
CMD ["pnpm", "dev", "--host", "0.0.0.0", "--port", "8080"]
