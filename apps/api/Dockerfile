FROM node:22-alpine AS base
ENV CI=true
RUN corepack enable && corepack prepare pnpm@11.9.0 --activate
WORKDIR /app

FROM base AS deps
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY apps/api/package.json apps/api/
COPY apps/web/package.json apps/web/
COPY packages/tsconfig packages/tsconfig
COPY apps/api/prisma apps/api/prisma
RUN pnpm install --frozen-lockfile --filter api...

FROM base AS build
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/apps ./apps
COPY --from=deps /app/packages ./packages
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY apps/api apps/api
RUN pnpm --filter api exec prisma generate
RUN pnpm --filter api build

FROM base AS runner
ENV NODE_ENV=production
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/apps ./apps
COPY --from=deps /app/packages ./packages
COPY --from=build /app/apps/api/dist ./apps/api/dist
COPY --from=build /app/apps/api/prisma ./apps/api/prisma
COPY --from=build /app/apps/api/public ./apps/api/public
COPY --from=build /app/apps/api/prompts ./apps/api/prompts
COPY --from=build /app/apps/api/package.json ./apps/api/package.json
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY apps/web/package.json apps/web/
RUN mkdir -p apps/api/uploads
EXPOSE 5001
WORKDIR /app/apps/api
CMD ["sh", "-c", "pnpm prisma migrate deploy && node dist/index.js"]
