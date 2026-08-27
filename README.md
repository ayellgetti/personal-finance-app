# example

pnpm + Turborepo monorepo with a TypeScript Express API, Vite React product app, a separate marketing site, and PostgreSQL.

## Apps

- `apps/api` — Express API on port `5001` (Swagger UI at `http://localhost:5001/docs`)
- `apps/web` — Product app (login, dashboard, planner). Vite on port `8080` in Compose (`5173` if you run Vite on the host). Walkthrough: `/guide`. Internal brief: `/why`
- `apps/website` — Public marketing site only. No auth, no finance data. Vite on port `8081`. “Open the app” links to `VITE_APP_URL` (default `http://localhost:8080`)

Local Postgres is exposed on **5433** (avoids clashing with an existing 5432 instance). Connection string is in `apps/api/.env`.

The Compose stack also runs nginx on **http://localhost** (port 80). The default host serves the marketing site (`apps/website`). `web.local.uat` serves the product app (`apps/web`) and still proxies `/api` and `/health` to the API. Hitting `http://localhost:8080` (app) or `http://localhost:8081` (website) directly still works.

AWS EC2: do not use this Compose file on a public host. Use `./deploy.sh` (or `docker-compose.prod.yml` by hand). HTTPS for `myfinancefreedom.com` / `www`: `docs/AWS_DEPLOY.md` section 3.

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
| `pnpm dev` | Run api, web, and website in watch mode |
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