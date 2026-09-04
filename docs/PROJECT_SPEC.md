# Project specification

Source of truth for **what this product is** and **how the system is built today**.

Engineering rules: root `CLAUDE.md`.  
Build order: `docs/DEVELOPMENT_PLAN.md`.  
Local setup: `README.md`.

Existing implementation wins over generic platform boilerplate. Do not create `apps/admin`, empty `@repo/*` packages, or move Prisma until that work is approved in the development plan.

Sales CRM (Track D) is an approved second product: `apps/crm` UI and `modules/sales-crm` in the existing `apps/api`. CRM-only Role/Permission RBAC is approved. Finance stays `userId` ownership. Do not add `tenantId`, a second Prisma schema, a second API, `/api/v1`, or a new JSON envelope. The unused `Contact` stub stays unused; CRM parties use `Crm*` models.

---

## 1. Project objective

Build a **production-ready TypeScript monorepo** that hosts a personal-finance product today, a Sales CRM (Track D) on the same API, and can host more apps and modules later without a full restructure.

The running finance product: an **India-first personal finance web app** — capture a household’s money, project cash flow and net worth, and turn that into an AI advisor report.

The Sales CRM (same login `User`, company-wide data, CRM-only RBAC) is specified in `docs/DEVELOPMENT_PLAN.md` Track D. `apps/crm` is the CRM UI. CRM HTTP lives under `/api/crm` (session, contacts, enquiries, follow-ups, clients, payments, tasks, calendar, users, roles, dashboard).

The system must be scalable, maintainable, secure, testable, modular, developer-friendly, and AI-agent friendly.

### Problem

People track income, EMIs, SIPs, insurance, and goals in spreadsheets or memory. They cannot see surplus, debt burden, coverage gaps, or retirement trajectory. Advice is generic and not tied to their numbers.

### Product

Authenticated users manage their financial picture, run deterministic forecasts, and request a structured AI report.

**Audience:** salaried or self-employed adult in India. Defaults: currency `₹`, inflation 6%, retirement age 60.

### Qualities

| Quality | Meaning here |
| --- | --- |
| Scalable | New finance modules and later apps under `apps/` without rewriting the monorepo |
| Maintainable | Match existing module patterns (`route` → `controller` → `service` → `model`) |
| Secure | JWT auth, bcrypt, no secrets in git/logs, Zod at boundaries |
| Testable | Planner, auth, advisor schema, and critical UI are testable without a full rewrite |
| Modular | `shared` vs `personal-finance` API modules; web `lib/finance` vs UI modules |
| Developer-friendly | Compose + `.env.example` + Swagger |
| AI-agent friendly | This spec + `CLAUDE.md` + `DEVELOPMENT_PLAN.md` |

---

## 2. Technology stack

**In use.** Do not replace without approval.

| Layer | Technology |
| --- | --- |
| Runtime | Node.js `>=20` |
| Package manager | pnpm 11 workspaces |
| Monorepo | pnpm Workspaces + Turborepo |
| Frontend | React 18 + Vite + TypeScript + Tailwind + shadcn/Radix |
| Backend | Express + TypeScript + ESM (source imports omit `.js`; build rewrites `dist`) |
| ORM | Prisma |
| Database | PostgreSQL |
| Cache | Redis (advisor report cache) |
| AI | OpenAI (advisor; optional locally) |
| Validation | Zod |
| Web tests | Vitest + Testing Library |
| API tests | `tsx --test src/tests` |
| API docs | OpenAPI + Swagger UI |
| Lint | ESLint (web), `tsc` (api) |
| Containers | Docker Compose |

**Not in the repo.** Do not add in a feature PR: Node 24 bump, Playwright, Pino, Winston, Prettier, Husky, GitHub Actions, Helmet, `apps/admin`, `packages/database`.

Redis is already used for advisor caching. Do not add BullMQ or a second queue until a real job exists.

---

## 3. Repository structure (current)

```text
.
├── apps/
│   ├── api/                 # Express API (finance + /api/crm)
│   ├── web/                 # Freedom Planner React app
│   ├── website/             # Public marketing site
│   └── crm/                 # Sales CRM React app (Track D)
├── packages/
│   └── tsconfig/
├── docs/
│   ├── PROJECT_SPEC.md
│   └── DEVELOPMENT_PLAN.md
├── CLAUDE.md
├── README.md
├── docker-compose.yml
├── package.json
├── pnpm-workspace.yaml
├── pnpm-lock.yaml
└── turbo.json
```

**Do not create** unused apps or packages (`admin`, `database`, `shared-api`, `ui`, root Playwright/Prettier configs) “because the boilerplate listed them.” `apps/crm` is the Track D product UI, not an unused admin scaffold.

Prisma lives at `apps/api/prisma/`, not `packages/database/`.

Env examples: root `.env.example` (Compose / `.env.dev`) and `apps/api/.env.example` (host-side API).

---

## 4. Workspace applications

| App | Path | Role |
| --- | --- | --- |
| Web | `apps/web` | Authenticated Freedom Planner UI (`8080` in Compose) |
| Website | `apps/website` | Public marketing site (`8081`); links into the product via `VITE_APP_URL` |
| CRM | `apps/crm` | Sales CRM UI (`8082`); dashboard, pipeline, tasks, calendar, users/roles. Public walkthroughs (no auth): `/banquet`, `/real-estate`, `/freedom`. |
| API | `apps/api` | Express backend (`5001`), Swagger `/docs`; finance + `/api/crm` |

Do not import `apps/web` source from `apps/website`, `apps/crm`, or the reverse.

**Admin (`apps/admin`)** does not exist. Do not scaffold it unless requested. CRM admin (users/roles) lives inside `apps/crm`, not a third app.

Do not split the API into microservices.

---

## 5. Frontend architecture (current)

React 18, Vite, TypeScript.

```text
apps/web/src/
├── components/           # UI + finance screens
├── components/layout/
├── hooks/
├── lib/auth/
├── lib/finance/          # store, remote, calculations, pdf
├── pages/                # Login, ForgotPassword, Index, NotFound
├── types/
└── main.tsx
```

Do not reshape into `src/features/*` in an unrelated PR.

Marketing site (`apps/website`) is a second Vite app: `src/pages`, `src/components`. It has no auth store and must not import `apps/web`.

Sales CRM (`apps/crm`) copies the web auth/API/shadcn pattern. LocalStorage keys are prefixed `crm-`. Do not import `apps/web` source.

```text
apps/crm/src/
├── components/layout/
├── components/modules/
├── lib/api.ts
├── lib/auth/
├── lib/crm/              # remote.ts, store.tsx (me + list caches)
├── pages/                # Login, ForgotPassword, Index, NotFound, public HTML walkthroughs (`/banquet`, `/real-estate`, `/freedom`)
├── types/crm.ts
└── main.tsx
```

- Keep API calls in `lib/finance/remote.ts` and `lib/api.ts`.
- Keep finance state in `lib/finance/store.tsx`.
- Do not put app-specific finance logic in a future `packages/ui`.

**Persistence split:** income, expenses, loans, investments, goals, and financial profile come from the API. **Insurance and daily expenses still live in `localStorage`.** Insurance API exists but the web client does not use it yet.

---

## 6. Backend architecture (current)

```text
apps/api/src/
├── config/               # app, routes, swagger, settings
├── middlewares/          # *.middleware.ts
├── modules/
│   ├── shared/           # auth, user, otp, device, ai, logging
│   ├── personal-finance/
│   └── sales-crm/        # CRM session, contacts, pipeline, calendar, admin
├── models/               # Prisma access
├── utils/                # prisma, redis, uploads, http-error, jwt, api, logger
├── tests/                # API tests
├── docs/                 # OpenAPI
├── env.ts
└── index.ts
```

Logging today: structured JSON via `utils/logger.util.ts`. Persistent errors: `FailureLog`. Not Pino/Winston.

---

## 7. Backend module architecture (current)

```text
modules/personal-finance/loan/
  loan.route.ts
  loan.controller.ts
  loan.service.ts
  loan.request.ts
```

```text
Route → Controller → Service → Model → Prisma → PostgreSQL
```

Do not reverse that direction. Do not add a `repository` layer unless an approved migration covers the whole module.

Zod lives in `*.request.ts` (advisor JSON uses `advisor.schema.ts`).

---

## 8–9. Database ownership and Prisma

**Source of truth:** `apps/api/prisma/schema.prisma`

**Client:** `apps/api/src/utils/prisma.util.ts` (one shared instance).

Applications besides `api` must not grow a second Prisma schema.

Use generated Prisma types. Prefer UUIDs, FKs, and indexes. Every table includes the User audit set: `isActive`, `createdBy`, `createdAt`, `updatedBy`, `updatedAt`, `deletedBy`, `deletedAt` (`createdBy` / `updatedBy` / `deletedBy` are optional strings).

---

## 10–11. Database models (this product)

This is **not** a greenfield “User + Role + Permission only” scaffold. Finance models already exist and are in scope.

**Auth / platform:** `User`, `RefreshSession`, `Otp`, `Session`, `FailureLog`

**Finance:** `FinancialProfile`, `Budget`, `Loan`, `Investment`, `Insurance`, `Goal`, `Planner`, `StatementImport`, `StatementLine`, `TaxScenario`, `CalculatorScenario`

**CRM (Track D):** `Role`, `Permission`, `RolePermission`, `UserRole`, `CrmContact`, `CrmEnquiry`, `CrmFollowUp`, `CrmClient`, `CrmPayment`, `CrmTask`, `CrmCalendarEvent`. Do not add `tenantId`. `CrmEnquiry.status` is the eight-stage sales pipeline: New → Contacted → Qualified → Discussion → Quotation Sent → Negotiation → Schedule Meeting / Site Visit → Closed. Do not add extra stages. `CrmPayment` uses `PaymentType` (`INCOME` / `EXPENSE`) and `PaymentMode` (`CASH`, `UPI`, `CARD`, `BANK_TRANSFER`, `CHEQUE`) only. Public HTML walkthroughs on `apps/crm` (same iframe pattern as finance `/guide`): `/banquet` (hall enquiry → booking), `/real-estate` (2BHK enquiry → token), `/freedom` (myfinancefreedom.com sales agent → Freedom Planner onboarding). These routes are unauthenticated.

**Unused / stub (do not build UI on these unless the plan says so):** `Contact` (chat-shaped; **not** the CRM party — do not reuse it), conversation tables, `Notification`, `Device`, `Socket`, `TradingView`, `Categories`, `Constant`, generic `Transaction`

Finance authorization is: authenticated user + `userId` on their rows. CRM authorization is Role + Permission (`requirePermission` after `requireAuth`). Do not put CRM permissions in the JWT. Do not apply CRM RBAC to finance routes.

Integrity: use Prisma relations and DB constraints, not only client checks.

---

## 12. Database migrations

| Intent | Command |
| --- | --- |
| Dev migration | `pnpm --filter api db:migrate:dev` |
| Deploy | `pnpm --filter api db:migrate` |
| Generate | `pnpm --filter api db:generate` |

There are no root `pnpm db:*` scripts yet.

Never rewrite migration history. Never reset a shared database without approval.

---

## 13–14. Logging

**Request / app logs:** stdout JSON (`logger.util.ts`) with requestId, method, path, status, duration where the request logger runs.

**DB:** `FailureLog` (`id`, `requestId`, `method`, `path`, `statusCode`, `message`, `stack`, `details`, `body`, `userId`, plus the shared audit columns).

Do not store passwords, JWTs, OTPs, or API keys in `details` / `body` / metadata.

Do not add a second generic `Log` table or Winston in a feature PR.

Logging must not dominate request latency (current failure-log write is acceptable).

---

## 15. API architecture (current)

Base path: **`/api`** (not `/api/v1`).

Examples: `/api/auth/login`, `/api/otp/stats`, `/api/users`, `/api/budgets`, `/api/loans`, `/api/investments`, `/api/insurances`, `/api/setup`, `/api/goals`, `/api/financial-profile`, `/api/planner`, `/api/advisor`, `/api/statements`, `/api/tax`, `/api/calculators`, `/api/crm/me`, `/api/crm/contacts`, `/api/crm/enquiries`, `/api/crm/dashboard`.

Also: `GET /health`.

Follow REST and appropriate status codes. Do not introduce `/api/v1` without migrating the web client.

---

## 16. API response (current)

Success and errors share one envelope (`apps/api/src/utils/api.util.ts`):

```json
{
  "status": true,
  "data": {},
  "message": "Success",
  "timestamp": "…",
  "requestId": "…"
}
```

Echo `x-request-id`. Do not switch to `{ success, data, meta }` / `{ success, error }` without approval.

---

## 17. Pagination

List endpoints that can grow must paginate. Existing lists often return `{ items }`. New unbounded lists should add `page` / `limit` (or cursor) and metadata (`page`, `limit`, `total`, `totalPages`).

Do not return unlimited rows from large tables.

---

## 18. Validation

Zod for bodies, query/params where used, and env (`apps/api/src/env.ts`).

Never trust the client.

Advisor output must pass `advisor.schema.ts` before cache or HTTP.

Do not create `packages/shared-validation` until two apps share the same schemas.

---

## 19. Authentication

Implemented: OTP register, password login, forgot-password OTP reset, access token, refresh token, revocation/logout, bcrypt.

Password fields on the web app include a show/hide control.

When `VITE_OTP_AUTO_VERIFY=true` (Compose / Vite; intended for local/dev) and generate/resend includes `otp` (API returns the code when `NODE_ENV` is not production), signup and forgot-password verify that code and skip the OTP entry screen.

Never store plaintext passwords. Never log tokens or OTPs.

SSO is out of scope until requested; do not block it with one-off token formats if a later SSO task lands.

---

## 20. Authorization

Finance: `requireAuth` + row ownership by `userId`. No finance Role/Permission matrix.

CRM (Track D): `requireAuth` then `requirePermission`. Load permission codes per request via `UserRole` → `RolePermission` → `Permission`. Missing permission → `403`. First authenticated `GET /api/crm/me` caller becomes `admin` if `UserRole` is empty; later users with no CRM role get `403` on `/api/crm/*`.

Do not scatter a second ad-hoc admin check in one finance controller. Do not put permissions in the JWT.

---

## 21. Multi-tenancy readiness

Single account per user. Do not implement Organization / Tenant / membership now.

Avoid unique constraints that would make a later org model impossible, but do not add `tenantId` on every table “just in case.”

---

## 22. Environment configuration

Typed config: `apps/api/src/env.ts`, `apps/api/src/config/setting.ts`.

`apps/api/.env.example` — never commit real secrets.

Typical: `NODE_ENV`, `PORT`, `DATABASE_URL`, `CORS_ORIGIN`, `JWT_*`, `OPENAI_*`, `REDIS_URL`, `ADVISOR_ALLOW_REFRESH`, `ADVISOR_IGNORE_QUOTA`, `UPLOAD_*`.

`ADVISOR_IGNORE_QUOTA=true` is a development-only escape hatch: it implies `ADVISOR_ALLOW_REFRESH`, stops advisor generations from consuming `User.aiReportLimit`, and never raises `402 AI_REPORT_LIMIT_REACHED`. Extra reports are granted per user by incrementing `User.aiReportLimit` (default 1), not by a global env var. `setting.ts` forces the quota override off when `NODE_ENV=production`.

---

## 23. Security

In use: CORS, JSON size via Express defaults, auth middleware, Zod, and route-scoped Multer with bounded disk staging.

Upload storage is selected behind `utils/upload.util.ts`; routes use `middlewares/upload.middleware.ts` so a later S3 storage engine does not change controller contracts.

Not in use: Helmet, rate limiting. Add only as an approved hardening task.

Never expose secrets.

---

## 24. API documentation

OpenAPI: `apps/api/src/docs/openapi.ts`. Swagger UI: `/docs` in development.

Update docs when endpoints or schemas change: auth, bodies, query, responses, errors, pagination.

---

## 25. Health and readiness

`GET /health` — process is up.

`GET /ready` is not implemented. If added: health = liveness; ready = Postgres (+ Redis if required for that environment).

---

## 26. Graceful shutdown

SIGINT / SIGTERM and fatal process events are registered in `apps/api/src/config/util.ts`: stop accepting requests, finish in-flight work, disconnect Prisma and any open Redis client, then exit.

Preserve that sequence and add future long-lived resources to the same cleanup path.

---

## 27. Testing

| Layer | Tool |
| --- | --- |
| Web unit/component | Vitest + Testing Library |
| API | `pnpm --filter api test` |

Prioritize planner engine, auth, advisor schema, finance remote/store, and critical UI.

Playwright E2E is not in the repo. Do not add it inside an unrelated feature.

---

## 28. Background jobs

Advisor generation is request-scoped (OpenAI, 90s timeout). Redis caches by user + planner context hash. Every generation — automatic or `refresh=true` — spends one unit of `User.aiReportLimit`; once the allowance is gone the saved report is returned with `stale: true` instead of calling OpenAI again. Extra reports are granted by incrementing that user's `aiReportLimit`. Planner reads are ordered (`createdAt`, `id`) so unchanged numbers keep producing the same context hash.

No `jobs/` / `workers/` tree. Do not add a queue until email, exports, or schedules are a real requirement.

Do not call OpenAI inside a Prisma `$transaction`.

---

## 29. Docker

`docker-compose.yml` runs Postgres (host **5433**), Redis (**6379**), pgAdmin, Redis Insight, api, web.

Dockerfiles: `apps/api/Dockerfile`, `apps/web/Dockerfile`.

There is no separate `docker-compose.dev.yml` or root `Dockerfile`. Do not add them unless that is the task.

Production images should stay multi-stage and minimal when Dockerfiles change.

---

## 30. CI/CD

No GitHub Actions workflow yet. When added: install → lint → typecheck → unit tests → build → (later) E2E, with Postgres service containers for DB tests.

---

## 31–32. Shared packages and dependency direction

**Exists:** `@repo/tsconfig` (`packages/tsconfig`).

**Do not create** `@repo/database`, `shared-api`, `shared-types`, `shared-validation`, `shared-config`, `shared-utils`, `ui`, `eslint-config` until each has a real second consumer.

Allowed:

```text
apps/web  →  packages (today: tsconfig)
apps/api  →  Prisma (in api) + packages
```

Forbidden:

```text
package → apps/*
apps/web → apps/api source files
a second Prisma schema in web
```

---

## 33. Formatting

No repo-wide Prettier. Match the file you edit (much of the TS uses semicolons and double quotes).

Do not reformat unrelated files. Do not apply “no semicolons / single quotes / 100 width” as a drive-by.

---

## 34. Git

Prefer conventional commits: `feat:`, `fix:`, `refactor:`, `test:`, `docs:`, `chore:`, `build:`, `ci:`.

Never commit `.env`, `node_modules`, `dist`, coverage, or secrets.

---

## 35. Business scope

### In (personal finance)

| Area | Behavior |
| --- | --- |
| Auth | OTP register, login, forgot-password reset, refresh, profile |
| Onboarding | Setup wizard → profile + income + expenses + loans + investments + insurance + required emergency fund + required FIRE path (Lean, Fat, or Coast) + other goals. Public walkthrough: `/guide` (Arjun Mehta sample, screenshot-style screens and advisor suggestions). Internal brief: `/why` (problem, objective, future vision). Course outline: `/course` (Financial Freedom Journey — 3 levels, 30 lessons; not live yet). |
| Cash flow | Recurring `Budget` income/expense |
| Debt | Loans: principal, ROI, tenure, EMI, EMI day. Each loan row opens an amortization dialog (summary, repayment chart, and the year/month schedule) computed by `/api/calculators/preview`. Users can simulate an immediate one-time prepayment, a higher EMI from the next instalment, or both and compare tenure and interest savings; this never saves a scenario or changes the loan. Credit cards: name, network, limit, outstanding, APR, due day, and minimum due. Stored with other client-only extras (same path as insurance and the budget tracker), not a server `Loan` row. Outstanding counts in net worth; minimum due counts in monthly surplus. |
| Investments | Corpus, contribution, ROI, remaining months, hold. Each holding opens a client-side projection dialog (contributions, estimated returns, projected value per year). |
| Insurance | Type, coverage, premium, expiry |
| Goals | Target/current amount, horizon; every user has a compulsory `emergency` goal and selects one `lean_fire`, `fat_fire`, or `coast_fire` path before completing Quick Setup. FIRE suggested targets inflate the user's added expenses to retirement and fund 25 years after they stop working (Lean = essentials, Fat = all expenses or 2× essentials, Coast = that corpus discounted so current investments can compound without extra SIPs). Each life goal opens a projection dialog showing the funding path against the inflation-adjusted target. |
| Profile | Retirement age, dependents, inflation, employment, currency |
| Planner | Server cash-flow / net-worth engine |
| AI advisor | OpenAI JSON from planner snapshot; Redis cache |
| Statements | Bank or phone/UPI statements as PDF, CSV/TSV, Excel or pasted text (password-protected PDF/Excel supported); categorized lines (not live bank aggregation, no OCR for scanned PDFs) |
| Tax calculator | Country-wise slabs and regime-specific deductions (India old/new, US/UK estimates); side-by-side "Old Regime / With Planner / New Regime" computation sheet per financial year, surcharge with marginal relief, saved scenarios — not e-filing. Opens as the first item in the Calculators sidebar group. |
| Calculators | A dedicated sidebar group opens Tax Calculator and Freedom Calculator first, then each saved deterministic tool: lumpsum, SIP, step-up SIP, EMI, loan (amount, rate, and tenure required; EMI optional; immediate prepayment and higher-EMI early-closure comparisons), future target, depreciation, manually rated INR currency conversion, Indian number-to-words, bond yield, stock return, and periodic IRR. Supported numeric inputs pair editable values with sliders. Summary figures include Indian number-to-words under each amount. Inputs and visual results sit side-by-side, recent saved calculations follow in an accordion, and detailed tables use the full width at the bottom. Results do not alter real loans, investments, or planner totals. Saved loans show their amortization and unsaved early-closure comparison in a dialog on Manage → Loans instead of redirecting here. |
| Freedom calculator | Lives in the Calculators sidebar group. A top toggle switches between Lean FIRE, FIRE, Coast FIRE, and Fat FIRE. The monthly expense prefills from recurring expenses, EMIs, and premiums and can be edited as an unsaved what-if; current age comes from the date of birth; retirement age and inflation save to the profile; expected return and coast age are local assumptions. Targets are the annual expense inflated to the retirement age times 15 (Lean), 25 (FIRE), or 50 (Fat); Coast FIRE is the FIRE number discounted at the expected return back to the coast age. This screen is a standalone what-if and does not change the FIRE goal suggestions described under Goals. |
| Learning hub | Static lessons |
| Report | AI summary + client PDF |

### Out (product)

- Live bank/UPI aggregation, PAN/Aadhaar KYC, tax **filing** (planning/estimates are in scope)
- Live market / TradingView
- Chat, contacts, push, sockets
- Shared household accounts
- Native mobile
- Banquet, society, school, social, habits — other verticals are **not** this product; do not scaffold them
- Sales CRM is Track D (`apps/crm` + `/api/crm`); do not fold it into `apps/web`

### Out (platform boilerplate)

- `apps/admin` (CRM admin UI is inside `apps/crm`, D8)
- Finance / platform-wide RBAC (CRM-only Role/Permission is Track D)
- Full multi-tenancy / `tenantId`
- `/api/v1` and new JSON envelope
- Moving Prisma to `packages/database`
- Reusing the unused `Contact` stub for CRM

### UX

1. Sign up / log in  
2. Optional getting-started guide (`/guide`) — Arjun Mehta sample walkthrough with screenshot-style screens  
3. Optional internal brief (`/why`) — problem statement, app objective, later vision (loans / insurance / mutual funds)  
4. Optional course outline (`/course`) — planned Financial Freedom Journey (Foundation / Growth / Freedom, 30 lessons). The in-app Learning hub is still static content.  
5. Quick setup (`User.quickStep`)  
6. Dashboard  
7. Manage: income, expenses, loans, credit cards, investments, insurance, goals  
8. Plan: budget tracker, statement analyzer, AI advisor, learning hub  
9. Calculators: tax calculator, freedom calculator, lumpsum/SIP/EMI and the other saved tools  
10. Report + PDF  

Light theme by default (dark is opt-in via the header toggle; the choice persists under the `fp-theme` key, shared with `/guide`, `/why`, and `/course`). Nav: Overview / Manage / Plan / Report / Calculators.

---

## 36. Runtime topology

Local (`docker-compose.yml`):

```text
Browser (Vite :5173)
    → /api proxy
Express (:5001)
    → PostgreSQL (:5433 host / :5432 in Compose)
    → Redis (:6379) — advisor cache
    → OpenAI (optional)
```

AWS (`docker-compose.prod.yml`): nginx serves the built SPA and proxies `/api` to Express (port 80, and 443 when `TLS_DOMAIN` is set). Postgres and Redis stay on the Compose network. See `docs/AWS_DEPLOY.md`.

Planner output is computed, not the source of truth. Advisor JSON lives in Redis, not a durable advice table.

---

## 37. Success

A user can complete setup, see a coherent dashboard and forecast from saved records, regenerate an advisor report when data changes, and download a PDF.

Income, expenses, loans, investments, and goals survive a new browser. **Insurance and daily spend currently do not** — that is Phase 1 in `docs/DEVELOPMENT_PLAN.md`.

Compose must run without an OpenAI key except for live advisor generation.
