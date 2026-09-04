# Development plan

Implementation order for this repository.

Engineering rules: root `CLAUDE.md`.  
Product and current architecture: `docs/PROJECT_SPEC.md`.

This file is **not** a greenfield scaffold. The monorepo, API, web app, Prisma finance schema, auth, planner, and advisor already exist. Do not recreate them. Do not mark foundation phases as `NOT STARTED`.

---

## Critical rule

Do not build the entire project in one operation.

Implement **one phase at a time**.

Never start the next phase while the current phase has unresolved:

- TypeScript errors
- ESLint errors (web)
- test failures in the area you touched
- build failures
- database migration failures

Do not treat unused boilerplate as the next job: Pino, Winston, Playwright, Husky, `packages/database`, `apps/admin`, `/api/v1`, `{ success, error }` envelopes, Node 24. Those sit in **Track C** and need explicit approval.

CRM-only Role/Permission tables are **Track D** (approved). Do not extend that RBAC onto finance routes.

---

## Status values

Use only:

```text
NOT STARTED
IN PROGRESS
BLOCKED
COMPLETED
DEFERRED
```

`DEFERRED` = specified in the generic platform plan, **not** required for the finance product, do not implement unless a human asks.

Never mark a phase `COMPLETED` if its validation is failing.

After each phase:

1. Run the validation for that phase.
2. Fix all errors.
3. Review for unnecessary complexity and package-boundary leaks.
4. Update `CLAUDE.md` / `PROJECT_SPEC.md` if behavior or conventions changed.
5. Update this file’s status.
6. Only then start the next phase.

---

## Cursor working rules

When starting a task:

1. Read `CLAUDE.md`
2. Read `docs/PROJECT_SPEC.md`
3. Read this file
4. Inspect relevant code
5. Follow existing patterns
6. Implement the smallest correct change
7. Run relevant tests (`pnpm --filter api test` and/or `pnpm --filter web test`)
8. Run `pnpm typecheck` (and web lint if you touched `apps/web`)
9. Review the diff
10. Update docs if the contract or product changed

Do not make unrelated changes.

Do not perform large refactors unless explicitly requested.

Do not replace technologies.

Do not weaken security or TypeScript configuration.

Do not bypass tests.

Do not manually modify Prisma migration history.

Do not add empty shared packages “for later.”

---

# Track A — Foundation (already delivered)

Generic scaffold phases mapped onto what is in the repo. **Do not re-run as if the repo were empty.**

### Phase A0 — Discovery

**Status: COMPLETED**

Assessment is `docs/PROJECT_SPEC.md` plus `CLAUDE.md`. Conflicts with the generic template (Prisma in `apps/api`, `/api` not `/api/v1`, no RBAC, no admin app, Node `>=20`, custom logger not Pino) are documented there. Do not delete finance code to match the template.

### Phase A1 — Monorepo foundation

**Status: COMPLETED**

Exists: root `package.json`, `pnpm-workspace.yaml`, `turbo.json`, `packages/tsconfig`, `README.md`, `pnpm-lock.yaml`. Scripts: `pnpm dev`, `pnpm build`, `pnpm lint`, `pnpm typecheck`. Node `>=20`, pnpm 11.

Not present (Track C): `.nvmrc`, root Prettier, root ESLint, root `pnpm format` / `pnpm test`, Node 24.

Validate if touching the root: `pnpm install`, `pnpm typecheck`.

### Phase A2 — Workspace packages

**Status: COMPLETED** (as needed)

Exists: `packages/tsconfig` only.

**DEFERRED** as empty shells: `database`, `shared-api`, `shared-types`, `shared-validation`, `shared-config`, `shared-utils`, `ui`, `eslint-config`.

### Phase A3 — Database foundation

**Status: COMPLETED** (finance schema, not RBAC scaffold)

Prisma: `apps/api/prisma/schema.prisma` + migrations. Client: `apps/api/src/utils/prisma.util.ts`. Postgres in Compose.

Models in use: `User`, auth sessions/OTP, `FinancialProfile`, `Budget`, `Loan`, `Investment`, `Insurance`, `Goal`, `Planner`, `FailureLog`, `StatementImport`, `StatementLine`, `TaxScenario`, `CalculatorScenario`.

CRM RBAC tables (`Role`, `Permission`, `UserRole`, `RolePermission`) and `Crm*` models are **Track D**, not a finance scaffold.

**Not created (Track C):** generic `Log`, `packages/database`, `pnpm db:seed`. Platform-wide RBAC beyond CRM is still deferred (Phase A8).

Commands: `pnpm --filter api db:migrate:dev`, `db:migrate`, `db:generate`.

### Phase A4 — Backend foundation

**Status: COMPLETED**

`apps/api`: Express, ESM, TypeScript, bootstrap, request IDs, error handler, graceful shutdown, `GET /health`.

Not present: Pino, Winston, `GET /ready`, package name `@repo/api` (workspace is `api`).

### Phase A5 — API architecture

**Status: COMPLETED**

Prefix `/api`. Envelope `{ status, data, message, timestamp, requestId }`. Zod `*.request.ts`. OpenAPI + Swagger `/docs`. Pagination on lists that use the shared list helper.

Do not migrate to `/api/v1` or a new envelope in a finance PR.

### Phase A6 — Logging

**Status: COMPLETED** (current design)

Stdout JSON logger + `FailureLog` for handled HTTP errors. Redact credentials/tokens/OTPs (see `CLAUDE.md`).

Pino + Winston + a second `Log` table: **DEFERRED** (Track C).

### Phase A7 — Authentication

**Status: COMPLETED**

OTP register, login, bcrypt, access/refresh JWT, revocation, `requireAuth`.

Gaps (tests): broaden invalid login, expiry, refresh, logout coverage — Track B tests, not a rewrite.

### Phase A8 — Authorization

**Status: DEFERRED** (finance / platform-wide)

Finance ownership stays `userId` from the token. Do not put `requirePermission` on finance routes.

CRM-only Role/Permission RBAC is approved as **Track D**. Do not treat that as a green light for `apps/admin` or finance RBAC.

### Phase A9 — Users module

**Status: COMPLETED** (product-sized)

`/api/users` profile get/patch (not a full admin CRUD/users directory). Do not add admin user CRUD unless `apps/admin` is approved.

### Phase A10 — Frontend foundation

**Status: COMPLETED** for `apps/web`

Vite + React 18, routing, layout, API client, auth store, finance store.

`apps/admin`: **DEFERRED**.

### Phase A11 — Frontend authentication

**Status: COMPLETED**

Login, logout, protected `/`, session + refresh handling.

E2E Playwright: **DEFERRED** (Track C).

### Phase A12 — Testing infrastructure

**Status: IN PROGRESS**

Web: Vitest + Testing Library. API: `tsx --test`. Coverage is thin (advisor, a few web tests).

Playwright: **DEFERRED**.

### Phase A13 — Docker

**Status: COMPLETED**

`docker-compose.yml`: Postgres, Redis, pgAdmin, Redis Insight, api, web. App Dockerfiles under `apps/*`.

No root `Dockerfile` or `docker-compose.dev.yml`. Admin service: **DEFERRED**.

---

# Track B — Personal finance (active)

This is the **default work**. Complete B1 before B2 unless a task says otherwise.

## Known gaps

| Gap | Detail |
| --- | --- |
| Insurance on the client | API exists; web still stores policies in `localStorage` (`LocalExtras.insurances`). |
| Daily expenses | UI only; no API. `Transaction` is an untyped JSON bag. |
| Tests | Planner engine and `remote.ts` / store need cases. |
| Learning hub | Static content; no persisted progress. Planned curriculum (Foundation / Growth / Freedom, 30 lessons) is outlined at `/course`; do not build the live journey until that work is approved. |
| Unused schema | Chat, notifications, devices, TradingView, `Categories` — do not build unless a later phase asks. |
| Root clutter | `prisma.README.md` is a one-liner. |

### Phase B1 — Persistence parity

**Status: NOT STARTED**

**Objective:** Every number on the dashboard for a logged-in user comes from Postgres.

1. Wire insurance CRUD in `apps/web/src/lib/finance/remote.ts` and `store.tsx` (same pattern as loans).
2. Drop `insurances` from `LocalExtras` after cutover.
3. Persist daily expenses (dedicated model or a typed `Transaction` shape); include in the planner only if they should affect surplus.
4. Confirm setup wizard insurance is written via `/api/setup` and reloaded via GET.
5. Regression: other browser / logout still shows the same insurance and daily spend.

**Validate:** `pnpm --filter api test`, `pnpm --filter web test`, `pnpm typecheck`, migrate if schema changed.

### Phase B2 — Planner and advisor quality

**Status: NOT STARTED**

Depends on B1 if daily spend should enter the planner snapshot.

1. Tests for `planner.engine.ts` (EMI vs budget subcategory de-dupe, hold investments, goal shortfall).
2. Confirm advisor Redis cache invalidates when the planner hash changes after mutations.
3. Empty/error UI when `OPENAI_API_KEY` is missing.
4. Optional: progress UI for long OpenAI calls (`OPENAI_TIMEOUT_MS` is 90s).

**Validate:** API advisor + planner tests, web advisor empty states, `pnpm typecheck`.

### Phase B3 — Product polish

**Status: NOT STARTED**

1. Budget tracker: budget vs actual from server data; month navigation.
2. Seed `Categories` and drive pickers from API instead of hardcoded maps in `remote.ts`.
3. Insurance expiry reminders only if using `Notification` with a real delivery path.
4. Tighten OpenAPI so Swagger matches the web client.

**Validate:** typecheck, tests for touched modules, OpenAPI updated.

Public marketing UI lives in `apps/website` (separate from `apps/web`). Do not fold landing pages into the product app.

### Phase B4 — Optional product surfaces

**Status: NOT STARTED**

Do not start until B1 is done unless explicitly asked:

- Chat / contacts
- Device push and sockets
- TradingView / market feed
- Shared household accounts
- Learning-hub progress

### Phase B5 — Statement analyzer and tax planner

**Status: COMPLETED**

Approved product surfaces (not bank aggregation or tax filing):

1. Bank / phone statement analyzer: CSV or pasted SMS/UPI text → categorized lines, credit/debit summary, stored as `StatementImport` + `StatementLine`. Routes `/api/statements`. Web: Plan → Statement Analyzer.
2. Country-wise tax calculator: slab catalog (India old/new FY 2024-25 and 2025-26, US federal 2025 single, UK England FY 2025-26), preview + saved `TaxScenario`. Routes `/api/tax`. Web: Calculators → Tax Calculator.
3. Regime comparison sheet: `POST /api/tax/compare` returns one column per regime for a financial year plus a "With Planner" column driven by separate planned amounts, and the row-by-row income / exemption / Chapter VI-A / surcharge / cess breakdown. Adds 80E, 80EEA, 80GG, 80TTA, surcharge with marginal relief, and per-section `deductionLines` on `TaxPlanResult`. Web selects a financial year (not a single regime) and splits income and deduction entry into separate panels.

**Validate:** `pnpm --filter api test` (includes `statement-tax.test.ts`), `pnpm --filter web test` (includes `TaxPlannerModule.test.tsx`), `pnpm typecheck`, migrate `20260822120000_statement_and_tax`.

### Phase B6 — Financial calculators

**Status: IN PROGRESS**

Approved standalone tools: lumpsum, SIP, step-up SIP, EMI, loan (amount, rate, and tenure required; EMI optional; immediate one-time prepayment and higher-EMI early-closure comparisons), future target, straight-line/written-down-value depreciation, manually rated INR currency conversion, Indian number-to-words, bond yield, stock return, and periodic IRR. Tax Calculator and Freedom Calculator open as the first two items in the Calculators sidebar group (they are not `CalculatorScenario` types). Each remaining tool can be opened directly from the same group, and supported numeric inputs pair editable values with sliders. Saved loans reuse `LoanResultPanel` inside an amortization dialog on Manage → Loans and expose the same unsaved early-closure comparison rather than redirecting into this screen. Previewing does not persist; saved scenarios use `CalculatorScenario`. Calculator scenarios do not alter real loans, investments, planner totals, or advisor context.

Routes: `/api/calculators`. Web: Calculators sidebar group.

**Validate:** `pnpm --filter api test`, `pnpm --filter web test`, `pnpm typecheck`, `pnpm --filter web lint`, migrate `20260831100000_calculator_scenarios`.

---

# Track C — Engineering platform (optional)

**Status: NOT STARTED** (entire track)

Not required for product completeness. Do not mix into Track B PRs. Requires explicit approval.

| Item | Generic phase | Note |
| --- | --- | --- |
| Node 24, `.nvmrc`, root Prettier/ESLint/`format` | 1, 14, 18 | Current Node `>=20` |
| Empty `@repo/*` packages | 2, 31 | Create only with a second consumer |
| Move Prisma to `packages/database`, root `pnpm db:*`, seed | 3, 12 | Breaking move |
| Pino / Winston / `Log` table | 4, 6 | Replaces working logger + `FailureLog` |
| `/api/v1` + new JSON envelope + repositories | 5 | Breaking API |
| `GET /ready` | 4, 17 | Additive; lowest-risk item if needed |
| RBAC (finance / platform-wide) | 8 | CRM-only RBAC is Track D; do not apply it to finance |
| `apps/admin` | 10, 13 | New app |
| Playwright E2E | 11, 12, 18 | New toolchain |
| Husky + lint-staged | 14 | |
| GitHub Actions CI | 15 | Postgres service containers |
| Helmet, rate limiting, audit | 16 | |
| Production checklist (`/ready`, image non-root, CI) | 17–18 | |

If a Track C item is approved, implement **that item only**, keep the current `/api` envelope and module layout unless the approval says to migrate them.

---

## Track B engineering habits

- New finance fields: Prisma migrate → model/service/route → OpenAPI → web types + `remote.ts` + UI. No second localStorage copy when an API exists.
- Advisor: change `advisor.schema.ts` and the prompt together.
- Prefer Compose + `apps/api/.env.example`. Core CRUD must work without OpenAI.
- Definition of done for a Track B phase: implementation, typecheck, relevant tests, OpenAPI if HTTP changed, this file’s status updated.

---

## Current architecture (do not “fix” toward the generic diagram)

```text
React web (:5173)     Freedom Planner
apps/crm (:8082)      Sales CRM UI
    → API client (/api proxy)
Express API (:5001)
    → middleware (requestId, auth, validate, errors)
    → /api/auth, /api/users, finance modules (userId ownership)
    → /api/crm/* (Role/Permission; requirePermission)
    → Prisma → PostgreSQL (:5433 host)
    → Redis (advisor cache)
    → OpenAI (optional advisor)
```

Shared today: `packages/tsconfig` only.

Do not add `tenantId`, a second Prisma schema, a second API, `/api/v1`, or a new JSON envelope. The unused `Contact` stub stays unused; CRM parties are `Crm*` models.

The system should stay modular without extra packages or an admin app until Track C is approved.

---

# Track D — Sales CRM

Second product on the same Express/Prisma API. Frontend is `apps/crm`. Backend modules live under `apps/api/src/modules/sales-crm/` and models under `apps/api/src/models/sales-crm/`.

**Constraints (do not violate):**

- Same `User` login identity as Freedom Planner. Staff created later by CRM Admin still need finance `User` fields (`dob`, `gender`, …).
- RBAC is CRM-only. Finance routes stay `requireAuth` + `userId` ownership.
- Unused Prisma `Contact` stub stays unused. New tables are `CrmContact`, `CrmEnquiry`, `CrmFollowUp`, `CrmClient`, `CrmPayment`, `CrmTask`, `CrmCalendarEvent` plus `Role` / `Permission` / `RolePermission` / `UserRole`.
- No `tenantId`. All CRM rows are company-wide; access is Role + Permission.
- No second Prisma client, no second API process, no `/api/v1`, no envelope change.
- Do not fold CRM into `apps/web`. Do not scaffold banquet entities.

**RBAC bootstrap (no seed script):** if `Permission` is empty, insert the catalog and four roles (`admin`, `manager`, `sales`, `viewer`). If `UserRole` is empty, the first authenticated `GET /api/crm/me` caller becomes `admin`. Later authenticated users with no CRM role get `403` on `/api/crm/*` (they can still use `/api/auth` and finance). Permissions are loaded per request, not stored in the JWT.

Do not start D2 while D1 typecheck, tests, or migration are failing.

### Phase D0 — Docs

**Status: COMPLETED**

Record Track D, `apps/crm` as a second product, CRM-only RBAC, unused `Contact` stays unused, and the no-tenant / no-second-API constraints in this file, `docs/PROJECT_SPEC.md`, and `CLAUDE.md`.

### Phase D1 — Schema + RBAC + `/me`

**Status: COMPLETED**

Prisma `Crm*` + Role/Permission models and migration `20260904074646_sales_crm`; `requirePermission`; catalog + first-admin bootstrap; `GET /api/crm/me` → `{ user, roles, permissions }`. No `apps/crm` scaffold. No contact/enquiry HTTP CRUD.

**Validate:** `pnpm --filter api test` (82 passing, including CRM bootstrap/401/403), `pnpm --filter api typecheck`, migration `20260904074646_sales_crm`.

### Phase D2 — `apps/crm` shell

**Status: COMPLETED**

Vite app on port **8082**, login / forgot-password, AppLayout, `GET /api/crm/me`, admin nav hidden without `crm.users.read` / `crm.roles.read`, Docker/nginx/CORS examples. Pipeline/work/admin screens land in D3–D8.

**Validate:** `pnpm --filter crm test` (12 passing), `pnpm --filter crm typecheck`, `pnpm --filter crm lint`.

### Phase D3 — Contacts

**Status: COMPLETED**

`apps/crm` Contacts module: table, type filter, search, create/edit dialog (name, mobile, type, email, company), remove confirm. Client: `lib/crm/remote.ts` + list cache in `CrmProvider`. Backend contacts API was already in `/api/crm/contacts`.

### Phase D4 — Enquiry + follow-up

**Status: COMPLETED**

Enquiries table with status filter and create/edit. Follow-ups list with overdue highlight. Shared loading / empty / error / 403 states.

### Phase D5 — Convert, clients, payments

**Status: COMPLETED**

Enquiry Convert (`POST /api/crm/enquiries/:id/convert`) upserts the client in the CRM store. Clients table links to the contact and payments views. Payments table records amount, method, and status (no gateway).

`$transaction` on convert. No OpenAI/Redis inside the transaction.

### Phase D6 — Tasks kanban

**Status: COMPLETED**

Four columns (Todo / In-Progress / In-Review / Done). Status changes via native select or “Move to …” actions. No drag-and-drop library.

### Phase D7 — Calendar

**Status: COMPLETED**

Month grid of `GET /api/crm/calendar?from&to` (follow-ups, tasks, standalone events). Click an item for detail; create-event dialog.

Union of follow-up due dates, task due dates, and standalone `CrmCalendarEvent`.

### Phase D8 — Users/roles admin UI

**Status: COMPLETED**

Users admin: create staff (`dob`, `gender`, mobile, email, password, `roleIds`) and patch roles. Roles: list and edit permission ids; hidden without `crm.roles.read`, edit disabled without `crm.roles.update`. Admin nav still hidden without read permissions.

