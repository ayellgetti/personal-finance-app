# example

pnpm + Turborepo monorepo with a TypeScript Express API, Vite React product app, a separate marketing site, Sales CRM, and PostgreSQL.

## Apps

- `apps/api` — Express API on port `5001` (Swagger UI at `http://localhost:5001/docs`)
- `apps/web` — Product app (login, dashboard, planner). Vite on port `8080` in Compose (`5173` if you run Vite on the host). Walkthrough: `/guide`. Internal brief: `/why`. Course outline: `/course`
- `apps/website` — Public marketing site only. No auth, no finance data. Vite on port `8081`. “Open the app” links to `VITE_APP_URL` (default `http://localhost:8080`)
- `apps/crm` — Sales CRM UI. Vite on port `8082`. Login reuses `/api/auth`; session is `GET /api/crm/me`. Prefer the Vite `/api` proxy.

Local Postgres is exposed on **5433** (avoids clashing with an existing 5432 instance). Connection string is in `apps/api/.env`.

The Compose stack also runs nginx on **http://localhost** (port 80). Hosts: `local.uat` / `www.local.uat` → marketing (`apps/website`); `web.local.uat` → product app (`apps/web`, `/api` and `/health` still proxied); `crm.local.uat` → Sales CRM (`apps/crm`, `/api` and `/health` still proxied); `api.local.uat` → API. Hitting `http://localhost:8080` (app), `http://localhost:8081` (website), or `http://localhost:8082` (CRM) directly still works.

These hostnames resolve only if they are in `/etc/hosts`. Without them the browser fails on DNS before nginx is reached:

```bash
sudo tee -a /etc/hosts >/dev/null <<'EOF'
127.0.0.1       local.uat www.local.uat website.local.uat
127.0.0.1       web.local.uat crm.local.uat api.local.uat
EOF
```

Port 80 allows one listener. The dev nginx cannot start while `docker-compose.prod.yml` is up locally — stop that stack first (`docker compose -p personal-finance-prod stop`), otherwise `docker-nginx` stays in `Created` and `http://localhost` silently serves the production build instead.

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
| `pnpm dev` | Run api, web, website, and crm in watch mode |
| `pnpm build` | Build all apps |
| `pnpm typecheck` | Typecheck all apps |
| `pnpm lint` | Lint all apps |
| `pnpm --filter api db:migrate` | Apply Prisma migrations |
| `pnpm --filter api db:generate` | Generate the Prisma client |
| `pnpm --filter crm test` | CRM UI tests |

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