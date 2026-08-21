# example

pnpm + Turborepo monorepo with a TypeScript Express API, Vite React web app, and PostgreSQL.

## Apps

- `apps/api` — Express API on port `5001` (Swagger UI at `http://localhost:5001/docs`)
- `apps/web` — Vite + React on port `5173` (proxies `/api` to the API)

Local Postgres is exposed on **5433** (avoids clashing with an existing 5432 instance). Connection string is in `apps/api/.env`.

## Setup

```bash
pnpm install
cp apps/api/.env.example apps/api/.env
docker compose up -d
pnpm --filter api db:migrate
pnpm dev
```

## Scripts

| Command | Description |
| --- | --- |
| `pnpm dev` | Run api and web in watch mode |
| `pnpm build` | Build all apps |
| `pnpm typecheck` | Typecheck all apps |
| `pnpm lint` | Lint all apps |
| `pnpm --filter api db:migrate` | Apply Prisma migrations |
| `pnpm --filter api db:generate` | Generate the Prisma client |

## API architecture

The API uses class-based layers:

- `config/` — validated settings and application bootstrap
- `controller/` — shared base controller and response helpers
- `modules/*/*.model.ts` — Prisma database access
- `modules/*/*.service.ts` — business logic
- `modules/*/*.controller.ts` — HTTP handlers
- `modules/*/*.request.ts` — Zod request validation
- `middlewares/*.middleware.ts` — request ID, access logs, authentication, validation, and errors
- `utils/api.util.ts` — constant response envelope

Every JSON response contains `status`, `data`, `message`, `timestamp`, and
`requestId`. The same ID is returned in the `x-request-id` response header.
Clients may supply their own `x-request-id`; otherwise the API generates a UUID.

All handled HTTP errors (4xx and 5xx) are stored in PostgreSQL's `FailureLog`
table with request, user, status, stack, and validation details. Structured
request logs are also written to stdout/stderr for container log collection.



{
  "email": "akash.y@example.com",
  "password": "AAbb12345$"
}