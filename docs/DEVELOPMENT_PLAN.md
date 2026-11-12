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

Vite + React 18, routing, layout, API client, auth store, finance store. Product SPAs (`apps/web`, `apps/crm`) later gained installable PWA shells (`vite-plugin-pwa`); that is in use, not a new track.

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

### Phase B7 — Freedom Planner mobile PWA

**Status: COMPLETED**

Approved phone-first finance client in `apps/mobile-fp`, alongside the unchanged CRM
phone app in `apps/mobile`. It reuses the existing `/api` finance contracts,
authentication, planner engine, advisor, statements, tax, and calculators. It does
not add Prisma models, a second calculation engine, CRM permissions, `/api/v1`, or
cross-app source imports.

Bottom tabs are Home, My Plan, Wealth, Goals, and Advisor, with Profile in the header. Home
uses `GET /api/planner/report`; entity screens persist API-backed records only
through their existing endpoints. Secondary tools live in the drawer. The PWA runs
on port `8086` at `mweb.local.uat`, uses `fp-*` session keys, and keeps the same
safe-area, service-worker, and runtime-environment conventions as `apps/mobile`.

Deliver incrementally: workspace/auth shell → six-section navigation and finance
remote layer → Home → My Plan → Wealth and Goals → Advisor/Profile/Setup and
secondary tools → Docker/nginx/docs and regression validation.

**Validate:** `pnpm --filter mobile-fp typecheck`, `lint`, `test`, and `build`;
relevant API tests; `pnpm --filter web test && pnpm --filter web build`;
`pnpm --filter mobile test && pnpm --filter mobile build`; manual responsive checks
at 320, 360, 390, and 430 CSS pixels. Playwright remains deferred.

---

### Phase B8 — Product review remediation (Nov 2026 review)

Source: "Freedom Planner — Product, UX & Customer Experience Review" (5/10 verdict).

**P0 (trust, correctness, copy): IN PROGRESS**

Done in `apps/web` (+ tax catalog):

- `dataReadiness()` gates verdicts: no net-worth/freedom hero, health score, coach verdicts, projection or cashflow charts until income and expenses exist.
- Health score shows "unlocks after income, expenses and one saving" with unscored sub-checks greyed.
- Empty states no longer claim "debt free", "Adequately Covered", "Funded", or "On track" at ₹0.
- Wizard: no jargon footer, emergency target prefilled from expenses and skippable, FIRE path optional, implementation words removed.
- Tax catalog adds FY 2026-27 (default, carried forward from 2025-26).
- Advisor copy: plain language, not-regulated-advice and data-use note.

Open P0 work (needs a human or backend): CA review of section references against the Income-tax Act, 2025; legal review of the disclaimer; a "delete my data" endpoint; Yes/No/Later EMI question (needs a persisted flag).

**P1 (in progress):**

- Done: 6-section navigation (Home, Money In/Out incl. Investments and Insurance, Goals, Advisor, Learn, Tools incl. Freedom Calculator and Tax; multi-screen sections expand in place; AI Chat and five niche calculators stay routable but unlisted). Tax screen prefilled from saved income, EPF/PPF/NPS and premiums (`lib/finance/tax-inputs.ts`), with a "switch regime and save ₹X" headline and 80C usage.
- Done: one-headline dashboard (health score + "Fix this first" card; full numbers behind a toggle) and one action button per tip on the dashboard and advisor plan (`actionForCategory`, `Recommendation.action`); tips are ranked High impact first and empty until income and expenses exist.
- Done: verified-vs-assumed tags on dashboard tips (`Recommendation.basis`, `BasisChips`: "From your data" / "Assumption" as text) and assumption captions on the insurance targets. AI-generated advisor steps are not tagged (the API response has no per-step basis).
- Done (partial): quick start. Setup is now Profile, Income, Expenses, then a "First result" step (surplus, savings rate, months of safety) with "See my dashboard now"; loans, investments, insurance, emergency fund, goals and review follow as optional. The Profile step now needs only retirement age, employment type, inflation and a dependents count (all prefilled); dependent names and details are optional and added later in Profile. The profile API now accepts fewer member details than dependents (never more).
- Done: single expense hub (`ExpenseHub`): Expenses is one screen with Monthly bills, Daily log and Import statement tabs under a "Spending this month" total (bills + this month's daily log). Budget Tracker and Statement Analyzer are listed under Tools in the sidebar and open as their own screens; the same two screens are also tabs in the Expenses hub. Statement analysis is still separate server data and is not added to the total.
- Done: emergency-fund advice has one owner (Goals). A plan lists it once (`keepOneEmergencyItem`, applied to the local advisor and to AI plans on display), the Learning Hub coach points to Goals instead of repeating the target, and the dashboard tip links there.
- P1 remaining: importing parsed statement lines into the expense total (needs a de-duplication rule).

**P2 (in progress):**

- Done: monthly check-in and history. New `CheckIn` table (one row per user per month, migration `check_in`), `GET/PUT /api/check-ins` (OpenAPI + tests), and a Progress screen under Home: review five numbers (net worth, income, expenses, health score) and save in one tap, trend chart, milestones (first ₹1 L, ₹10 L, score 50/75) and year-over-year once the same month a year earlier exists. The client supplies the numbers from its saved data.
- Done: goal fixes (`goalFixes`): an off-track or at-risk life goal shows three ways back (more monthly cash, a later date the current surplus can reach, or a lower target in today's money), with the 11% return and inflation assumptions stated. The emergency fund is excluded (owned by its own card).
- Done (term cover only): term target now depends on the person (`termCoverMultiple`): 5× income with no dependents, 10× with one, 15× with two or more, capped at years left to retirement, plus loans. The coach's life-insurance rule uses the same target. Health cover is unchanged (₹10 L floor, ₹7.5 L per person above two people); city tier needs a profile field that does not exist. Multipliers are rules of thumb pending an adviser's review.
- Done (spot-check findings only): accessibility. Menu and chat-send buttons named; setup profile and emergency-fund inputs labelled (Full Name, Age, Employment Type, target, saved, date); field errors announced (`role="alert"`); status badges (success, warning, danger) carry an icon as well as colour; toasts moved to bottom-right so they stop covering the page title. A full audit (every screen, dark-mode contrast, keyboard and screen-reader pass) has not been run.
- Done: saved what-ifs. New `FreedomScenario` table (migration `freedom_scenario`), `GET/POST /api/freedom-scenarios` and `POST /api/freedom-scenarios/remove` (max three per user, 409 beyond that; OpenAPI + tests). The Freedom Calculator can save the current edit under a name and compares it side by side with up to three saved what-ifs. Compare only: there is no "load" back into the calculator, because retirement age and inflation edits there write to the profile.
- Done: India-aware retirement view (`lib/finance/retirement-india.ts`, `IndiaRetirement` panel in the Freedom Calculator, web only, no API change). Shows retirement corpus by source (EPF, PPF, NPS, market, fixed income, gold and property), estimated gratuity (15/26 formula, basic = 40% of salary, career from 22, capped at ₹20 L), the NPS 40% annuity kept out of the spendable corpus and turned into pension, and healthcare inflated faster than general inflation, beside the standard number. All assumptions are editable and default to: healthcare 15% of spending at 8% inflation, annuity 6%, blank-return fallbacks EPF 8.25%, PPF 7.1%, NPS 9%. The headline Freedom Calculator numbers are unchanged. Defaults need an adviser's confirmation. Open: NPS quick-add still defaults to 10% (this view respects a holding's own return), PPF/EPF maturity dates and withdrawal timing are not modelled.
- Review fixes (code review of P0 to P2): check-in list query now parsed in the controller (Express 5 re-reads `req.query`, so the validation middleware's coercion is lost; other list endpoints only work because Prisma-free paging coerces strings, so the middleware should be fixed separately); Profile saves with a dependents count and no details; Tax prefill follows late-loading data without overwriting typed figures; bare-date daily-log entries read as local dates; the three what-if limit is held under a per-user advisory lock; healthcare inflation never below general inflation; check-in month rebuilt at save time, rejected when in the future, and net worth must equal assets minus liabilities; what-if load failure blocks saving; insurance term bar follows the gated target; `Progress` now exposes `aria-valuenow`.
- Not started: a due-this-month nudge on the dashboard and salary-day / tax-deadline reminders.

### Phase B9 — Shareable plan link (review P3)

**Status: IN PROGRESS** (branch `feat/shareable-plan-link`)

- Done: owner creates a read-only link from Summary Report ("Share this plan"): label, 7/30/90-day expiry, up to five live links, revocable, view counts. New `PlanShare` table (migration `plan_share`). `GET/POST /api/plan-shares`, `POST /api/plan-shares/remove` (signed in) and `GET /api/shared/plans/:token` (public). The viewer page is `/shared/:token`.
- Snapshot, not live: the link shows totals, scores, goals (by name) and up to five next steps as of the day it was created. It never carries name, email, date of birth, employer or the names of individual loans, cards, investments or policies. Tip text is redacted for known account names, and the API rejects unknown keys.
- Security: token is 32 random bytes (43 characters); only its SHA-256 hash is stored; unknown, expired and revoked tokens all return the same 404; responses are `no-store` and `noindex`; the page sends no referrer; expected 4xx answers on the public route are not written to `FailureLog` (otherwise random URLs could grow that table). **The repo has no rate limiting**; guessing a 256-bit token is not feasible, but request volume is unbounded. This is the one finance route without `requireAuth`, recorded in CLAUDE.md section 24 for approval.
- Not done: editing a link after creation, per-link view-only PDF, email or WhatsApp sending, mobile Freedom Planner (`apps/mobile-fp`) sharing.

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

Do not add `tenantId`, a second Prisma schema, a second API codebase, `/api/v1`, or a new JSON envelope. The unused `Contact` stub stays unused; CRM parties are `Crm*` models.

Production Compose (`docker-compose.prod.yml`) may run extra copies of the same API image against extra Postgres databases (`travel_crm`, `banque_crm`) so banquet and travel CRM data stay isolated. Local `docker-compose.dev.yml` does not start those copies. That is process isolation, not multi-tenancy and not a second API codebase.

The system should stay modular without extra packages or an admin app until Track C is approved.

---

# Track D — Sales CRM

Second product on the same Express/Prisma API. Frontend is `apps/crm`. Backend modules live under `apps/api/src/modules/sales-crm/` and models under `apps/api/src/models/sales-crm/`.

**Constraints (do not violate):**

- Same `User` login identity as Freedom Planner. Staff created later by CRM Admin still need finance `User` fields (`dob`, `gender`, …).
- RBAC is CRM-only. Finance routes stay `requireAuth` + `userId` ownership.
- Unused Prisma `Contact` stub stays unused. New tables are `CrmContact`, `CrmEnquiry`, `CrmFollowUp`, `CrmClient`, `CrmPayment`, `CrmInvoice`, `CrmInvoiceLine`, `CrmMessageTemplate`, `CrmMessage`, `CrmTask`, `CrmCalendarEvent` plus `Role` / `Permission` / `RolePermission` / `UserRole`.
- No `tenantId`. All CRM rows are company-wide; access is Role + Permission.
- No second Prisma client, no second API codebase, no `/api/v1`, no envelope change. Extra Compose API containers (`api-travel`, `api-banque`) are the same image pointed at different databases.
- Do not fold CRM into `apps/web`. Do not copy `apps/crm` into `apps/travel-crm` / `apps/banque-crm`. Do not scaffold banquet-specific entities.

**RBAC bootstrap (no seed script):** if `Permission` is empty, insert the catalog and four roles (`admin`, `manager`, `sales`, `viewer`). If the catalog already exists but is missing codes, those codes are inserted and granted to the four built-in roles. If `UserRole` is empty, the first authenticated `GET /api/crm/me` caller becomes `admin`. Later authenticated users with no CRM role get `403` on `/api/crm/*` (they can still use `/api/auth` and finance). `POST /api/crm/public/enquiries` is unauthenticated banquet or travel intake and is not behind `requireAuth`. Permissions are loaded per request, not stored in the JWT.

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

Vite app on port **8082**, login / forgot-password, AppLayout, `GET /api/crm/me`, admin nav hidden without `crm.users.read` / `crm.roles.read`, Docker/nginx/CORS examples. Pipeline/work/admin screens land in D3–D8. Public use-case HTML pages (no auth, finance `/guide` pattern): `/banquet`, `/real-estate`, `/freedom`. Public banquet intake form (no auth): `/banquet-enquiry` → `POST /api/crm/public/enquiries`. Public banquet handover checklist (no auth, fill, print, or copy a WhatsApp message, no API): `/banquet-checklist`. Public travel intake form (no auth): `/travel-enquiry` → the same endpoint with `kind: "travel"`. Freedom Planner (`apps/web`) and Sales CRM (`apps/crm`) are installable PWAs (standalone shell cache, no `/api` cache); the marketing site is not.

**Validate:** `pnpm --filter crm test` (12 passing), `pnpm --filter crm typecheck`, `pnpm --filter crm lint`.

### Phase D3 — Contacts

**Status: COMPLETED**

`apps/crm` Contacts module: table, type filter, search, create/edit sheet (name, mobile, type, email, company), remove confirm, and a View sheet with Enquiries (each enquiry lists its follow-ups), Payments, and Current booking tabs. Client: `lib/crm/remote.ts` + list cache in `CrmProvider`. Backend contacts API was already in `/api/crm/contacts`; `GET /api/crm/contacts/:id` returns the contact plus related enquiries (nested follow-ups), payments, and bookings.

### Phase D4 — Enquiry + follow-up

**Status: COMPLETED**

Enquiries table with status filter and create/edit sheet. Follow-ups list with overdue highlight. Shared loading / empty / error / 403 states.

Enquiry pipeline (exactly these eight stages): New → Contacted → Qualified → Discussion → Quotation Sent → Negotiation → Schedule Meeting / Site Visit → Closed. Convert sets `closed`. Dashboard cards include leads generated today, customer due dates, overdue follow-ups (`nextFollowupDate` past and enquiry not closed), follow-ups for today (open enquiries with `nextFollowupDate` on the current calendar day; click opens Follow-ups with When = Today), and open versus closed.

Enquiry create requires an exact `dueDate` that is today or in the future. The CRM form uses a calendar with shortcuts for 7 days, 1 month, 3 months, and 6 months from today; past days cannot be selected. Note and status changes append follow-up history (date, notes, status, `nextFollowupDate`). Follow-ups are not written to `CrmCalendarEvent` or the main calendar feed. `GET /api/crm/followups/calendar?from&to` powers the Follow-ups calendar (new enquiry vs follow-up counts; click a day for enquiries due; overdue highlighted). Follow-ups Timeline view (and the enquiry detail sheet) shows lead created → follow-up history → next contact → closed/booked.

### Phase D5 — Convert, clients, payments

**Status: COMPLETED**

Enquiry Convert (`POST /api/crm/enquiries/:id/convert`) upserts the client in the CRM store and creates a `CrmCalendarEvent` linked to the enquiry. First convert requires `startsAt` (today or later) and either `endsAt` or `slot` (`morning` / `evening` / `full_day`; slot windows are IST). Contact and client view sheets show Current booking, Enquiries, and Payments tabs. Payments table records amount, `PaymentType` (INCOME / EXPENSE), `PaymentMode` (CASH / UPI / CARD / BANK_TRANSFER / CHEQUE), and status (no gateway).

`$transaction` on convert. No OpenAI/Redis inside the transaction.

### Phase D6 — Tasks kanban

**Status: COMPLETED**

Four columns (Todo / In-Progress / In-Review / Done). Status changes via native select or “Move to …” actions. No drag-and-drop library. Work nav also includes **Reminders** (standalone calendar events: title, description, time, optional contact) with table, card, and calendar views.

### Phase D7 — Calendar

**Status: COMPLETED**

Month grid of `GET /api/crm/calendar?from&to` (tasks, booked enquiry events, reminders, and scheduled follow-ups). Events linked to an enquiry are `booking` items; removing one also soft-deletes its enquiry, and it is blocked once a linked payment is `paid`. Click an item for detail. Clicking a day can add a reminder (title, description, time, optional contact) or open enquiry, follow-up, booking, payment, or task create forms on the picked date.

Union of task due dates and `CrmCalendarEvent` rows, including events linked to booked enquiries. Follow-up contact dates live on the Follow-ups calendar (`GET /api/crm/followups/calendar`).

### Phase D8 — Users/roles admin UI

**Status: COMPLETED**

Users admin: create staff (`dob`, `gender`, mobile, email, password, `roleIds`), patch profile and roles, and reset one listed user's password (`POST /api/crm/users/{id}/password`, `crm.users.update`). A reset cannot reuse the current or a recent password, and it revokes that user's refresh sessions. Roles: list, create, view, and edit name plus permission ids (catalog includes a description for each permission); hidden without `crm.roles.read`, create/edit disabled without `crm.roles.update`. Admin nav still hidden without read permissions.

### Phase D9 — `apps/mobile` shell

**Status: COMPLETED**

Vite app on port **8085** (`mcrm.local.uat`): a phone-first companion over the same `/api/crm` endpoints and the same `requirePermission` codes. No API, Prisma, OpenAPI, or envelope changes — this phase is frontend only.

Layout: sticky header with a menu button (left drawer for Contacts, Follow-ups, Tasks, Reminders, Users, Roles, plus theme and sign out), centred title, and a plus-circle button on Home only, opening a bottom quick-add sheet whose actions are filtered by the matching `crm.*.create` permissions. The current five-tab bottom nav is Home, Enquiries, Calendar, Booked, and Payments; Profile sits in the header. A tab the role cannot open renders disabled so the bar keeps five slots. The column grows up to tablet width (48rem), with `env(safe-area-inset-*)` padding on both edges.

Screens: Home (dashboard stat tiles, next-up agenda card, due-today list), Contacts (debounced search, type chips, detail sheet with call/email, create sheet), Enquiries (stage chips, detail sheet with stage change, create sheet), Calendar (day agenda with prev/next and event create), Profile (account, roles, permission count, sign out). Lists page with "Load more" against the existing `{ items, pagination }` responses rather than fetching everything.

The app keeps its own `lib/api.ts` and `lib/auth/*` (apps never import another app's source) and namespaces localStorage under `mobile-`. Quick-add navigates to `<tab>?new=1`; the tab reads that intent and opens its own create form. Follow-ups is a mobile screen: today, overdue, and upcoming lead activity, plus follow-up history that can be edited or removed. Opening a row shows that lead's conversation (created, notes, follow-ups, next contact, closure). Tasks, Reminders, Users, and Roles were placeholders in this phase; Phase D10 replaced them.

Adding this workspace also required a `COPY apps/mobile/package.json apps/mobile/` line in every existing Dockerfile, because `pnpm install --frozen-lockfile` validates the lockfile against all workspace members.

**Validate:** `pnpm --filter mobile test` (19 passing), `pnpm --filter mobile typecheck`, `pnpm --filter mobile lint`, `pnpm --filter mobile build`; `pnpm --filter crm test` (102 passing) and `pnpm --filter crm build` unchanged.

### Phase D10 — `apps/mobile` CRM parity

**Status: COMPLETED** (frontend only; no API, Prisma, OpenAPI, or envelope changes)

Brings `apps/mobile` to the authenticated feature set of `apps/crm` with phone layouts, over the same `/api/crm` endpoints and `crm.*` permission codes. Public banquet/travel pages, walkthroughs, the banquet checklist, and customer chat stay out of scope.

- Contracts: the full permission catalog, admin types, and remote calls for contact update/remove, client create/update/remove, task update/status/remove, calendar event list/remove, users, roles, permissions, and conversion results.
- Validation: `lib/mobile/validate.ts` mirrors the API Zod rules for contacts, enquiries (close reason when closed), follow-ups, payments, reminders, tasks, booked records, profile name, password change, staff, roles, and date ranges. Forms show inline errors and keep their values when the server refuses.
- Records: contact hub with every booking, editable booking notes, edit/remove; enquiry list/cards/board with confirmed Booked or Lost closes (convert when permitted) and assignee filter; follow-ups list/cards/month/timeline; booked status/date filters, list/cards/month, manual create and remove; payments status/type/payee/date filters, list/cards/month, totals, and payee lookup by id; calendar edit/remove for reminders and bookings.
- New screens: Tasks (horizontal four-column board), Reminders (event pages filtered to standalone reminders), Users, Roles (at least one permission). Quick Add includes follow-up, task, payment, and reminder.
- Home: contacts by type (`/contacts?type=`), monthly income/expense (`/payments?type=&month=current`), due today (`/enquiries?due=today`), closed enquiries, and tasks by status. Profile: name edit, password change, and the permission list.
- Known limits: enquiry text search, `due=today`, and payment type filter the loaded page because those list endpoints have no text, due-date, or type query. The API has no user delete, so mobile has none either. Authenticated HTTP 403 coverage stays in the service and permission-middleware tests; `app.test.ts` checks the unauthenticated envelope.

List screens other than Home use one Filter & Sort sheet (`components/FilterSortSheet.tsx`): search stays on the page, and the sheet adds applied chips, sort, ascending or descending order, and the screen's existing filters. Profile stays a settings form. Sort runs on the loaded rows (`lib/mobile/sort.ts`); it does not add an API sort query.

**Validate (2026-10-10):** `pnpm --filter mobile test` — 31 files, 112 tests, exit 0. `pnpm --filter mobile typecheck` — exit 0. `pnpm --filter mobile lint` — 0 errors, 5 existing `react-refresh/only-export-components` warnings. API and CRM source were not changed for the filter sheet.

### Phase D11 — Communications

**Status: COMPLETED**

Staff can send email, SMS, and in-app notifications from a saved template or by writing the message at send time. Placeholders such as `{{name}}`, `{{mobile}}`, `{{email}}`, and `{{company}}` are filled from the contact (and any extra variables) when the message is saved, and that rendered text is what goes out later. Every message can be scheduled; omitting the time sends it immediately. Scheduled rows can be changed or cancelled until the sender claims them.

`CrmMessageTemplate` and `CrmMessage` live under `/api/crm/communications` with `crm.communications.*`. The signed-in staff member's in-app inbox is `GET /api/crm/notifications` (any CRM role, only their own rows). Delivery uses the existing SMTP and Twilio settings. When those are unset outside production, the message is logged and marked sent. A timer in the API process claims due rows every 15 seconds. There is no separate queue. A send that is still marked `sending` after two minutes can be claimed again.

`apps/crm` and `apps/mobile` both have a Communications screen (messages and templates) and a header inbox for in-app notifications. The unused platform `Notification` stub stays unused.

**Validate:** `pnpm --filter api test` (communications and RBAC), `pnpm --filter api typecheck`, `pnpm --filter crm typecheck`, `pnpm --filter mobile typecheck`.


### Phase W1 — Website overhaul

**Status: COMPLETED** (frontend only; no API, Prisma, OpenAPI, envelope, or dependency changes)

`apps/website` grows from one page to four public routes: `/`, `/why`, `/guide` (the Arjun Mehta walkthrough), and `/course` (the 30-lesson map). Shared `PageHero`, `TableOfContents`, and `CtaBand` components and a `usePageMeta` hook (per-route title and description) back the new pages. The header gains Why, Guide, and Course links and a phone menu, and Home gains entry points and a trust strip.

Decisions: the Why page is a deliberately public-safe version (no commercial model, partner economics, or distribution vision). `apps/web` is untouched and keeps its own in-app copies; the website imports nothing from it. Copy was checked against `Home.tsx` and the in-app course so it makes no claims the app does not support. No package.json or lockfile changes.

**Validate (2026-11-12):** `pnpm --filter website test` — 7 files, 37 tests, exit 0. `pnpm --filter website typecheck` — exit 0. `pnpm --filter website lint` — 0 errors, 0 warnings, exit 0. `pnpm --filter website build` — exit 0 (`dist/index.html` produced). Dev-server curl of `/`, `/why`, `/guide`, `/course`, and an unknown path returned 200 each (SPA fallback). Phone/desktop visual checks, the menu, and the 1024px two-column Guide layout were not visually verified.
