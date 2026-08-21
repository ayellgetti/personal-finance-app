# CLAUDE.md

## Purpose

Mandatory engineering rules for developers and AI agents (Cursor, Claude Code, Copilot, Codex, and others) working in this repository.

This is a TypeScript monorepo: multiple apps, shared packages, PostgreSQL, auth, and personal-finance modules, with room for more services later.

Before changing code, read:

```text
CLAUDE.md
docs/PROJECT_SPEC.md
docs/DEVELOPMENT_PLAN.md
README.md
```

These files are the source of truth.

- **`CLAUDE.md`** — how to work in this repo (rules).
- **`docs/PROJECT_SPEC.md`** — what the product is and how it is built **today**.
- **`docs/DEVELOPMENT_PLAN.md`** — what to build next, in order.

Existing implementation wins over generic templates. Do not migrate the stack, folder layout, API envelope, or Prisma location to match a boilerplate unless `DEVELOPMENT_PLAN.md` says to and a human approved it.

---

# 1. General development principles

1. Prefer simple solutions.
2. Prefer existing patterns over new ones.
3. Keep modules loosely coupled.
4. Keep business logic testable.
5. Keep infrastructure replaceable where practical.
6. Do not over-engineer.
7. Do not introduce abstractions without a clear reason.
8. Keep changes focused.
9. Avoid unrelated refactoring.
10. Maintain backward compatibility unless a breaking change is intentional.

The goal is a clean, maintainable production system, not the largest possible architecture.

---

# 2. Read before editing

Before modifying any file:

1. Inspect the relevant directory.
2. Read the existing implementation.
3. Identify existing patterns.
4. Search for reusable utilities.
5. Understand dependencies.
6. Make the smallest appropriate change.

Never blindly overwrite existing code.

Never recreate functionality that already exists.

---

# 3. Technology stack

**In use (do not replace without approval):**

| Area | Technology |
| --- | --- |
| Runtime | Node.js `>=20` (`package.json` `engines`) |
| Package manager | pnpm 11 workspaces (`pnpm-lock.yaml`) |
| Monorepo | pnpm Workspaces + Turborepo |
| Frontend | React 18 + Vite + Tailwind + shadcn/Radix |
| Backend | Express + TypeScript + ESM |
| ORM | Prisma |
| Database | PostgreSQL |
| Cache | Redis (advisor report cache) |
| AI | OpenAI (advisor JSON; optional locally) |
| Validation | Zod |
| Web tests | Vitest + Testing Library |
| API tests | Node test runner via `tsx --test` |
| API docs | OpenAPI + Swagger UI (`/docs`) |
| Frontend lint | ESLint (`apps/web`) |
| API lint | `tsc --noEmit` |
| Containers | Docker Compose |

**Not in the repo yet.** Do not add these as drive-bys. Put them on `DEVELOPMENT_PLAN.md` and get approval first: Playwright, Pino, Winston, Prettier, Husky, lint-staged, Helmet, GitHub Actions, `packages/database`, `/api/v1`, a second logging stack.

---

# 4. Node.js

Minimum: **Node.js >= 20**, enforced via root `package.json` `engines`.

Do not bump to 24 or add `.nvmrc` unless that is an approved task.

---

# 5. Package manager

Use pnpm. Never `npm install` or `yarn install` at the repo root.

`pnpm install` only from the **repository root**. Never from a workspace.

Package commands:

```bash
pnpm --filter <package-name> <command>
```

Workspace names today: `api`, `web` (not `@repo/api`).

Examples:

```bash
pnpm --filter api test
pnpm --filter web test
pnpm --filter api db:migrate:dev
```

Commit `pnpm-lock.yaml`. Do not hand-edit the lockfile unless necessary.

---

# 6. TypeScript

Shared config: `packages/tsconfig/base.json` (`strict`, `noUncheckedIndexedAccess`, unused locals/parameters, consistent casing).

Do not use `any` or `// @ts-ignore` unless unavoidable. If required, comment why and why a safer option is not possible.

Prefer `unknown` with narrowing.

Do not weaken TypeScript config to make code compile.

Do not enable extra `compilerOptions` repo-wide as part of an unrelated change.

---

# 7. Prisma ORM

PostgreSQL is the database. Prisma schema is the source of truth.

**Current location (do not move without approval):**

```text
apps/api/prisma/schema.prisma
```

Use Prisma-generated types. Do not duplicate model types by hand.

```ts
import type { User } from "@prisma/client";
import type { Prisma } from "@prisma/client";
```

---

# 8. Prisma client

One shared client. Do not create a Prisma Client per HTTP request.

**Current initialization:**

```text
apps/api/src/utils/prisma.util.ts
```

This repo’s data path is:

```text
Route → Controller → Service → Model (apps/api/src/models/) → Prisma Client → PostgreSQL
```

Do not introduce a `repository` layer unless migrating an entire module with approval. Match neighboring modules (`*.route.ts`, `*.controller.ts`, `*.service.ts`, `*.request.ts`).

---

# 9. Prisma migration rules

Never rewrite Prisma migration history.

Development:

```text
Modify schema.prisma
  → prisma migrate dev   (pnpm --filter api db:migrate:dev)
  → prisma generate
  → run relevant tests
```

Production / Compose deploy:

```text
prisma generate → prisma migrate deploy → start app
```

(`pnpm --filter api db:migrate` is `migrate deploy`.)

Never edit production schema outside migrations.

Never delete migrations to hide schema problems.

Never reset a shared database unless explicitly approved.

---

# 10. Prisma commands

There are no root `pnpm db:*` scripts yet. Use the api workspace:

```bash
pnpm --filter api db:generate
pnpm --filter api db:migrate
pnpm --filter api db:migrate:dev
```

Do not invent root `db:seed` / `db:format` scripts unless that is the task.

---

# 11. Database design

Use PostgreSQL-native features where they fit: UUIDs, FKs, indexes, unique constraints, timestamps, JSON only when justified.

Existing models often include `id`, `isActive`, `createdBy`, `createdAt`, `updatedBy`, `updatedAt`, `deletedBy`, `deletedAt`, and Match the nearest model; 

Prefer Prisma enums when introducing a closed set of string values on a new field; do not rewrite existing string columns in the same PR.

---

# 12. Database performance

Avoid unbounded `findMany()` on tables that can grow.

Use pagination, filtering, sorting, indexes, `select`, and `include` only when needed.

Avoid N+1 queries. Keep transactions short; no external HTTP (OpenAI) inside `$transaction`.

---

# 13. Prisma transactions

Use `$transaction` when several writes must succeed or fail together (example: setup wizard).

Do not wrap unrelated single writes. Do not call OpenAI or Redis inside a DB transaction.

---

# 14. Database seed

No seed pipeline yet. If added, seeds must be deterministic and idempotent. Seed reference data (categories, roles), not fake production portfolios, unless the task says so.

---

# 15. Monorepo architecture

```text
apps/api     Express API
apps/web     Vite React app
packages/tsconfig
```

Applications under `apps/`. Shared code under `packages/`.

Do not put app-specific finance UI in `packages/`.

Do not import source files from another app. Use a package public API if sharing is required.

Avoid circular dependencies.

---

# 16. Frontend rules

Stack: React 18, Vite, TypeScript, Testing Library, Vitest.

**Current layout** (do not reshape into `src/features` in an unrelated PR):

```text
apps/web/src/
├── components/        # UI + finance modules
├── components/layout/
├── hooks/
├── lib/auth/
├── lib/finance/       # store, remote, calculations
├── pages/
├── types/
└── main.tsx
```

Do not put business logic or API calls in components when `lib/finance/remote.ts` or a service already exists.

Keep server round-trips in `remote.ts`. Keep planner/display math in `lib/finance/calculations.ts` or the API planner.

---

# 17. Backend rules

Stack: Node, Express, TypeScript ESM, Prisma, PostgreSQL, Zod.

Relative imports omit file extensions (`from "../utils/http-error.util"`). Do not add `.js`. `pnpm --filter api build` rewrites `dist` specifiers so Node ESM can load them.

**Current layout:**

```text
apps/api/src/
├── config/            # app, routes, swagger, settings
├── middlewares/       # *.middleware.ts (request-id, auth, validate, errors)
├── modules/
│   ├── shared/        # auth, user, otp, device, ai, logging
│   └── personal-finance/
├── models/
├── utils/             # prisma, redis, uploads, http-error, jwt, api, logger
├── tests/             # Node test runner files
├── docs/
├── env.ts
└── index.ts
```

---

# 18. Backend module structure

Match existing modules:

```text
modules/personal-finance/loan/
  loan.route.ts
  loan.controller.ts
  loan.service.ts
  loan.request.ts      # Zod
```

- **Routes** — HTTP paths and middleware (`requireAuth`, `validateBody`).
- **Controllers** — thin HTTP adapters.
- **Services** — business rules.
- **Models** — Prisma access.
- **request.ts** — Zod (not `*.schema.ts`, except advisor JSON schema).

Do not put business logic in routes.

Do not put Prisma queries in controllers.

---

# 19. API versioning

**Current prefix:** `/api/...` (not `/api/v1`).

Examples: `/api/auth/login`, `/api/loans`, `/api/advisor`.

Do not introduce `/api/v1` without an approved migration of all clients.

Follow REST and appropriate status codes.

---

# 20. API response format

**Current envelope** (do not change):

```json
{
  "status": true,
  "data": {},
  "message": "Success",
  "timestamp": "…",
  "requestId": "…"
}
```

Implemented in `apps/api/src/utils/api.util.ts`.

Echo `x-request-id`. Clients may send their own.

Do not switch to `{ success, data, meta }` / `{ success, error }` without approval.

---

# 21. Pagination

List endpoints that can grow must paginate. Existing list helpers already return `{ items }`. When adding lists, include page/limit (or cursor) and metadata (`page`, `limit`, `total`) where the dataset is unbounded.

Do not return unlimited rows from large tables.

---

# 22. Validation

Zod at boundaries: body, query, params, env (`apps/api/src/env.ts`).

Never trust the client.

Do not create `packages/shared-validation` until two apps actually share the same schemas.

Advisor model output: validate with `advisor.schema.ts` before cache or HTTP response.

---

# 23. Error handling

Central handler: `apps/api/src/middlewares/error-handler.middleware.ts`.

`HttpError` for known failures. Handled 4xx/5xx persist to `FailureLog`.

Do not expose stack traces, SQL, paths, or secrets to clients in production.

---

# 24. Authentication

Current: OTP register, password login, JWT access + refresh, logout/revocation via refresh store, bcrypt passwords.

Never store plaintext passwords.

Never log credentials, OTPs, or tokens.

Finance routes use `requireAuth`.

---

# 25. Authorization

Today: authenticated user owns their finance rows (userId from the token). There is no Role/Permission matrix.

Do not hard-code a second ad-hoc admin model in one controller.

Do not scaffold RBAC until the plan asks for it.

---

# 26. Multi-tenancy

Single-user-per-account today. Do not add `tenantId` / `organizationId` everywhere “just in case.”

Avoid unique constraints that would block a later org model if that work is approved.

---

# 27. Environment configuration

Typed env: `apps/api/src/env.ts` + `apps/api/src/config/setting.ts`.

Do not read `process.env` throughout the app.

Keep `apps/api/.env.example` current. Never commit real secrets.

Typical keys: `DATABASE_URL`, `PORT`, `CORS_ORIGIN`, `JWT_*`, `OPENAI_*`, `REDIS_URL`, `ADVISOR_ALLOW_REFRESH`, `UPLOAD_*`.

---

# 28. Logging

Structured JSON via `apps/api/src/utils/logger.util.ts` (stdout/stderr). Request logs include requestId, method, path, status, duration where the request logger runs.

Do not add Pino or Winston in a feature PR.

---

# 29. Sensitive data redaction

Never log: passwords, JWTs, refresh/access tokens, API keys, secrets, Authorization headers, OTPs, or sensitive bodies.

---

# 30. Database logging

`FailureLog` stores handled HTTP errors (request, user, status, stack, details).

Do not add a second generic application-log table unless planned.

DB logging must not block the request more than the current failure-log write.

---

# 31. Security

Keep CORS, JSON body limits, auth middleware, and Zod validation.

File uploads use route-scoped Multer middleware with configured size limits. The default storage provider stages files on disk and can be replaced without changing route handlers; never mount uploads globally.

Do not strip security to make local dev easier without documenting why.

Helmet, rate limits, and similar are not present; add only as an approved hardening task.

---

# 32. Health checks

`GET /health` exists.

Do not add `/ready` unless the task is readiness (Postgres/Redis). If added, `/health` stays liveness; `/ready` checks dependencies.

---

# 33. Graceful shutdown

`App` delegates SIGINT/SIGTERM and fatal process events to `apps/api/src/config/util.ts`. Preserve: stop listener, close Prisma and any open Redis client, then exit.

Add future long-lived resources to the same shutdown path.

---

# 34. API documentation

OpenAPI in `apps/api/src/docs/openapi.ts`, Swagger at `/docs`.

Update OpenAPI when you add or change endpoints.

---

# 35. Testing

Web: Vitest + Testing Library.

API: `pnpm --filter api test` (`tsx --test src/tests/**/*.test.ts`).

Prioritize business logic (planner, auth, advisor schema), critical APIs, and critical UI flows.

Do not chase 100% coverage. Do not add Playwright until it is an approved phase.

---

# 36. Frontend testing

Test user-visible behavior, not private component internals.

---

# 37. E2E testing

No Playwright suite yet. Do not add one inside an unrelated feature.

---

# 38. Formatting

No repo-wide Prettier config. Match the file you edit (existing code uses semicolons and double quotes in many TS files).

Do not reformat unrelated files.

---

# 39. ESLint

Web ESLint is the frontend linter. API typecheck is `tsc`.

Do not disable rules globally. Do not ignore lint in the area you changed.

---

# 40. Git hooks

No Husky / lint-staged. Do not add them unless that is the task.

Do not use `--no-verify` as normal workflow if hooks are added later.

---

# 41. Docker

`docker-compose.yml` plus `apps/api/Dockerfile` and `apps/web/Dockerfile`.

Keep production images lean. Do not run as root in production images when changing Dockerfiles, where practical.

Local Postgres is **5433** on the host. Redis **6379**. API **5001**. Web **5173**.

---

# 42. CI/CD

No GitHub Actions workflow in-repo yet. Do not invent CI files unless asked.

When CI exists it must fail on typecheck, lint, tests, and build.

---

# 43. Background jobs

Advisor generation is request-scoped (OpenAI). Redis caches the result.

Do not add a queue until a real job exists (email, exports, scheduled reports).

Do not block HTTP on long work beyond the existing advisor timeout.

---

# 44. Dependencies

Before adding a dependency: search the repo, reuse utilities, prefer maintained libraries, add it to the correct workspace.

Root `package.json` is for repo tooling (Turbo, TypeScript), not app libraries.

---

# 45. Git commit standards

Prefer conventional commits: `feat:`, `fix:`, `refactor:`, `docs:`, `test:`, `chore:`, `build:`, `ci:`.

Never commit `.env`, `node_modules`, coverage, `dist`, secrets, or temp files.

---

# 46. AI agent rules

Agents must:

- inspect before editing
- reuse existing code
- follow this architecture
- keep diffs focused
- test meaningful behavior
- update OpenAPI and these docs when behavior changes
- preserve security and strict TypeScript
- keep package boundaries

Agents must not:

- introduce `any`
- weaken TypeScript
- skip tests for the area they changed
- expose secrets
- rewrite Prisma migration history
- silently change the stack
- unrelated refactors
- delete features without approval
- move Prisma to `packages/database`
- change the JSON envelope or `/api` prefix
- persist a second copy of data in localStorage when an API already exists

When adding a finance entity: Prisma migrate → model/service/route → OpenAPI → `remote.ts` + store + UI.

Planner math: `apps/api/src/modules/personal-finance/planner/planner.engine.ts`.

Advisor: prompt + `advisor.schema.ts` together; cache in Redis.

Schema stubs (chat, notifications, devices, TradingView, `Transaction`) stay unused until the plan says otherwise.

---

# 47. Major architectural decisions

STOP and request approval if the change affects:

- technology stack
- Prisma location or migration history
- authentication / authorization model
- monorepo package boundaries
- API envelope or `/api` vs `/api/v1`
- security architecture

Routine implementation: use existing modules as the template.

---

# 48. Phase-based development

Follow `docs/DEVELOPMENT_PLAN.md`.

Do not implement the whole platform in one pass. Finish the current phase’s validation before expanding scope.

---

# 49. Definition of done

A task is done when:

- code matches existing patterns
- typecheck passes for touched workspaces
- relevant tests pass
- OpenAPI updated if the HTTP contract changed
- docs updated if product or conventions changed
- no secrets committed
- no unrelated files modified

---

# 50. Final principle

Optimize for correctness, security, maintainability, testability, simplicity, consistency, and scalability.

Prefer a smaller system that matches this repo over a large generic architecture.
