FROM node:22-alpine
ENV CI=true
RUN corepack enable && corepack prepare pnpm@11.9.0 --activate
WORKDIR /app

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY apps/api/package.json apps/api/
COPY apps/web/package.json apps/web/
COPY apps/website/package.json apps/website/
COPY apps/crm/package.json apps/crm/
COPY packages/tsconfig/package.json packages/tsconfig/
RUN pnpm install --frozen-lockfile --filter website...

COPY apps/website apps/website

WORKDIR /app/apps/website
EXPOSE 8081
CMD ["pnpm", "dev", "--host", "0.0.0.0", "--port", "8081"]
