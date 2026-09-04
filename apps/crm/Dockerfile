FROM node:22-alpine
ENV CI=true
RUN corepack enable && corepack prepare pnpm@11.9.0 --activate
WORKDIR /app

# pnpm validates the lockfile against every workspace member, so all manifests
# must be present even though the filter installs only crm's dependencies.
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY apps/api/package.json apps/api/
COPY apps/web/package.json apps/web/
COPY apps/website/package.json apps/website/
COPY apps/crm/package.json apps/crm/
COPY packages/tsconfig/package.json packages/tsconfig/
RUN pnpm install --frozen-lockfile --filter crm...

COPY apps/crm apps/crm

WORKDIR /app/apps/crm
EXPOSE 8082
CMD ["pnpm", "dev", "--host", "0.0.0.0", "--port", "8082"]
