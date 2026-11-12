# Website Overhaul Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add public `/why`, `/guide` and `/course` pages to `apps/website`, with clearer navigation, shared page components, and a stronger Home entry point, all converging on sign-up.

**Architecture:** Static React pages inside the existing `apps/website` Vite app, using `PageShell` and Tailwind tokens. Four small shared pieces (`usePageMeta`, `PageHero`, `TableOfContents`, `CtaBand`) carry the common structure; each page holds its content as typed constants. No API, no new dependencies, no change to `apps/web`.

**Tech Stack:** React 18, react-router-dom 6, Tailwind 3, lucide-react, Vitest + Testing Library (jsdom).

**Spec:** `docs/superpowers/specs/2026-11-12-website-overhaul-design.md`

All commands run from the repo root. Work in `apps/website` only (plus two docs files in Task 8).

## Global Constraints

- `apps/website` must not import from `apps/web` (or any other app). No new dependencies in any `package.json`.
- Do not modify anything under `apps/web`. Its in-app copies of `why.html`, `guide.html`, `course.html` and the `fp-course-progress` localStorage key stay as they are.
- Link into the product only with `appUrl(path)` from `@/lib/utils`. Primary CTA is `appUrl("/login")`.
- Keep existing disclaimers and tone: "not a fund house", no brokerage, no e-filing, no scheme distribution, forecasts are educational.
- The public Why page must not mention commissions, referral fees, trail, distribution revenue, partner economics, the flywheel, the "moat", or the "distribution platform" vision. It must not say "internal brief".
- Facts are copied unchanged from the source files in `apps/web/src/pages/`: Arjun Mehta's figures (`guide.html`) and the 30 lesson titles, tools and actions (`course.html`). Wording written for internal readers ("planned module", "the outline we will build toward", "Do not isolate this as Courses", "Do not ask the user to…") is rewritten for visitors. The facts stay.
- Relative-import style: use the `@/` alias as `Home.tsx` does. Match the file you edit: double quotes, semicolons.
- One `<h1>` per page. Interactive elements are real links/buttons with descriptive text.
- Each task ends with `pnpm --filter website test`, `pnpm --filter website typecheck` and `pnpm --filter website lint` passing before its commit. Use conventional commits. Commit trailer for this session: `Co-Authored-By: Claude Sonnet 5.5 <noreply@anthropic.com>`.

## Review Focus

Most likely to bite a visitor, each pinned by a test in the owning task:

1. A visitor opens `/why`, `/guide` or `/course` directly or refreshes. nginx already has `try_files … /index.html`, so this only needs a dev/preview check (Task 8); in tests, each page must render standalone inside `MemoryRouter`.
2. Moving between pages with in-app links leaves the scroll position halfway down the next page (Task 3: scroll to top on route change unless a hash is present).
3. Internal-voice or commercial copy leaks into public pages (Tasks 4 and 6: forbidden-phrase tests over rendered text).
4. Phone width: nav hidden below `lg` today, so mobile visitors cannot reach the new pages (Task 3: menu button).
5. Table-of-contents links point at ids that do not exist, or ids are duplicated (Task 2 and each page test: every TOC `href="#x"` has an element with `id="x"`).

---

### Task 1: `usePageMeta` hook

**Files:**
- Create: `apps/website/src/lib/usePageMeta.ts`
- Test: `apps/website/src/lib/usePageMeta.test.tsx`

**Interfaces:**
- Produces: `usePageMeta(title: string, description: string): void`. While the component is mounted, `document.title` equals `title` and `<meta name="description">` content equals `description`. On unmount both are restored to their previous values. If the meta tag is absent it is created and removed on unmount.

- [ ] **Step 1: Write the failing tests** in `usePageMeta.test.tsx`, rendering a tiny component that calls the hook:
  - `sets the document title and meta description while mounted`: assert `document.title === "Why | Freedom Planner"` and `document.querySelector('meta[name="description"]')` has `content` "desc".
  - `restores the previous title and description on unmount`: set `document.title = "Before"` and a description meta first; after `unmount()` both are back.
  - `creates the meta tag when missing and removes it on unmount`.
- [ ] **Step 2: Run** `pnpm --filter website test -- usePageMeta`. Expected: FAIL (module not found).
- [ ] **Step 3: Implement** `usePageMeta` with a single `useEffect` keyed on `[title, description]`.
- [ ] **Step 4: Run** the same command. Expected: PASS.
- [ ] **Step 5: Commit** `feat(website): add usePageMeta hook`.

### Task 2: Shared page components

**Files:**
- Create: `apps/website/src/components/PageHero.tsx`, `TableOfContents.tsx`, `CtaBand.tsx`
- Test: `apps/website/src/components/shared.test.tsx`

**Interfaces:**
- Produces:
  - `PageHero({ eyebrow, title, lead, children }: { eyebrow: string; title: string; lead: string; children?: ReactNode })`. Renders the only `<h1>` (the `title`), the eyebrow as small text, the lead as a paragraph, and `children` (actions) below.
  - `TableOfContents({ items }: { items: { id: string; label: string }[] })`. Renders `<nav aria-label="On this page">` with one `<a href={"#" + id}>` per item. Sticky on `lg` and up, a plain list below.
  - `CtaBand({ next }: { next: { to: string; label: string } })`. Renders a heading "Ready to try it with your own numbers?", a link named "Create your account" to `appUrl("/login")`, and a `react-router-dom` `<Link>` to `next.to` with text `next.label`.
- Consumes: `appUrl` from `@/lib/utils`.

- [ ] **Step 1: Write failing tests** in `shared.test.tsx` (wrap in `MemoryRouter`):
  - `PageHero renders one h1 with title, eyebrow, lead and actions`.
  - `TableOfContents renders a labelled nav with an anchor per item` (hrefs `#a`, `#b`).
  - `CtaBand links to the app login and to the next page` (`href` contains `/login`; next link `href` equals `/guide` for `{ to: "/guide", label: "See a real household" }`).
- [ ] **Step 2: Run** `pnpm --filter website test -- shared`. Expected: FAIL.
- [ ] **Step 3: Implement** the three components using the Tailwind tokens already used in `Home.tsx` (`container`, `font-display`, `rounded-full bg-primary`, `shadow-card`, `text-muted-foreground`).
- [ ] **Step 4: Run** the same command. Expected: PASS.
- [ ] **Step 5: Commit** `feat(website): add PageHero, TableOfContents and CtaBand`.

### Task 3: Header, footer, mobile menu, scroll reset

**Files:**
- Modify: `apps/website/src/components/PageShell.tsx` (`SiteHeader`, `SiteFooter`, `PageShell`), `apps/website/src/test/setup.ts`
- Test: `apps/website/src/components/PageShell.test.tsx`

**Interfaces:**
- Consumes: `NavLink`, `useLocation` from `react-router-dom`.
- Produces: header nav order **Why (`/why`), Guide (`/guide`), Course (`/course`), Product (`/#product`), FAQ (`/#faq`), Sign in (`appUrl("/login")`)**, shown inline at `lg` and up. Below `lg`, a button named "Open menu" (`aria-expanded`, `aria-controls`) toggles the same links in a panel; its name becomes "Close menu" when open. The three page links are `NavLink`s, so the current one gets `aria-current="page"`. Footer "On this site" lists Why, Guide, Course, Product, Life goals, Getting started, Tools; the old `appUrl("/guide")` footer link is removed. `PageShell` calls `window.scrollTo(0, 0)` when `pathname` changes and no hash is present.
- `setup.ts` gains a no-op `window.scrollTo` (jsdom does not implement it).

- [ ] **Step 1: Write failing tests** in `PageShell.test.tsx` (`MemoryRouter initialEntries={["/guide"]}`):
  - `marks the current page link with aria-current`: link "Guide" has `aria-current="page"`, "Why" does not.
  - `links to the three new pages`: hrefs `/why`, `/guide`, `/course`.
  - `menu button reveals the nav links on small screens`: click "Open menu"; button is now "Close menu" with `aria-expanded="true"`.
  - `footer no longer links the guide into the app`: no link whose `href` contains `/guide` points at the app origin (`appUrl("/guide")`).
  - `scrolls to top when the route changes`: spy `window.scrollTo`, navigate from `/why` to `/guide` with a `Link`, expect it called with `(0, 0)`; it is not called when the URL has a hash.
- [ ] **Step 2: Run** `pnpm --filter website test -- PageShell`. Expected: FAIL.
- [ ] **Step 3: Implement** the header, footer and scroll effect. Keep the existing logo, button and styling; do not restyle unrelated parts.
- [ ] **Step 4: Run** the full website test suite. Expected: PASS (the existing `Home.test.tsx` still passes).
- [ ] **Step 5: Commit** `feat(website): header navigation for new pages and a mobile menu`.

### Task 4: Why page (`/why`)

**Files:**
- Create: `apps/website/src/pages/Why.tsx`
- Modify: `apps/website/src/App.tsx` (add `<Route path="/why" element={<Why />} />` above `*`)
- Test: `apps/website/src/pages/Why.test.tsx`

**Interfaces:**
- Consumes: `PageShell`, `PageHero`, `TableOfContents`, `CtaBand` (next `{ to: "/guide", label: "See a real household" }`), `usePageMeta`.
- Produces: default export `Why`. Title meta "Why Freedom Planner exists", with a one-sentence description. Section ids and order: `problem`, `objective`, `today`, `trust`, `your-side`. Source for the first four sections is `apps/web/src/pages/why.html` (Problem statement, Objective of the app, What the app does today, Trust is the foundation), edited for a public reader. `your-side` ("How we stay on your side") is new: two or three sentences saying recommendations follow your plan and that doing nothing can be the right answer. It makes no revenue, partner or product-distribution claims.

- [ ] **Step 1: Write failing tests** in `Why.test.tsx`:
  - `renders one h1 and the five sections in order`.
  - `every table-of-contents link targets an existing id`.
  - `sign-up call to action points at the app and the next link goes to /guide`.
  - `sets the page title` (`document.title` contains "Why Freedom Planner exists").
  - `contains no commercial or internal-brief language`: the text of the `<main>` element (not the footer, which legitimately says "scheme distribution") does not match `/commission|referral|trail|distribution|flywheel|moat|internal brief|partner/i`.
- [ ] **Step 2: Run** `pnpm --filter website test -- Why`. Expected: FAIL.
- [ ] **Step 3: Implement** `Why.tsx` with section content as a typed constant at the top, `PageShell` wrapper, hero, a two-column layout with the TOC on `lg`, and `CtaBand` at the end. Read `why.html` for the facts; leave out the Vision, Business model, flywheel, moat and partner sections entirely.
- [ ] **Step 4: Run** the website tests. Expected: PASS.
- [ ] **Step 5: Commit** `feat(website): public Why page`.

### Task 5: Guide page (`/guide`)

**Files:**
- Create: `apps/website/src/pages/Guide.tsx`
- Modify: `apps/website/src/App.tsx` (route `/guide`)
- Test: `apps/website/src/pages/Guide.test.tsx`

**Interfaces:**
- Consumes: same shared pieces; `CtaBand` next `{ to: "/course", label: "Learn the course" }`.
- Produces: default export `Guide`. Sections (ids): `start` (4 numbered getting-started steps), `arjun` (profile card: age 32, retire at 55, salaried, 2 dependents, inflation 6%, ₹), `numbers` (monthly income ₹2,52,500 with its four sources; monthly outgo ₹1,48,967 with its four buckets; loans ₹49.00 L; investments ₹63.80 L; protection; safety buffer; goals), `dashboard` (net worth ₹19.60 L, monthly surplus ₹1.04 L, savings rate 41%, EMI/income 27%, what looked healthy, what the gauges flagged), `problems` (the four numbered problems), `plan` (the plan of action from `guide.html`), `enter` ("Now enter your data"). Present `problems` and `plan` side by side from `lg` up (before/after). All figures and wording of facts come from `apps/web/src/pages/guide.html`, copied unchanged.

- [ ] **Step 1: Write failing tests** in `Guide.test.tsx`:
  - `renders one h1 and a section for each id above`.
  - `shows Arjun's household figures` asserting the exact strings `₹2,52,500`, `₹1,48,967`, `₹19.60 L`, `41%`, `₹49.00 L`, `₹63.80 L`.
  - `lists four problems and four getting-started steps`.
  - `every table-of-contents link targets an existing id`.
  - `sign-up call to action points at the app; next link goes to /course`.
- [ ] **Step 2: Run** `pnpm --filter website test -- Guide`. Expected: FAIL.
- [ ] **Step 3: Implement** `Guide.tsx` with the data as typed constants, tables rendered as semantic `<table>` with captions (income, outgo, loans, investments), and the figures as cards.
- [ ] **Step 4: Run** the website tests. Expected: PASS.
- [ ] **Step 5: Commit** `feat(website): public Guide page with the Arjun Mehta walkthrough`.

### Task 6: Course page (`/course`)

**Files:**
- Create: `apps/website/src/pages/Course.tsx`
- Modify: `apps/website/src/App.tsx` (route `/course`)
- Test: `apps/website/src/pages/Course.test.tsx`

**Interfaces:**
- Consumes: same shared pieces; `CtaBand` next `{ to: "/", label: "Back to the home page" }`.
- Produces: default export `Course`. Typed constants: `levels: { id: "foundation" | "growth" | "freedom"; title: string; goal: string; modules: { title: string; lessons: { n: number; title: string; tool: string; action: string }[] }[] }[]` holding 3 levels, 10 modules in total (4 in Foundation, 3 in Growth, 3 in Freedom, as in `course.html`), and 30 lessons (numbers 1–30, titles, tool and action copied unchanged). Sections: product loop (5 steps: Learn, Check, Apply, Act, Track), three levels overview, one card per level listing its modules and lessons, and one example lesson. The primary hero action is "Start Level 1" linking to `appUrl("/login")`. TOC items are the three levels.
- Before writing copy, check the in-app route: `apps/web/src/App.tsx` serves `/course` (the Course module, with quizzes in `lib/finance/courseContent.ts`). Describe the course as something a signed-in user can take ("lessons in the app, with a short check on each"). Do not call it "planned" or "an outline we will build toward".

- [ ] **Step 1: Write failing tests** in `Course.test.tsx`:
  - `renders one h1, the five-step loop and three level sections`.
  - `lists all 30 lessons in order`: query lesson rows, expect 30, first title "What does financial freedom mean?", last "Create your financial-freedom roadmap".
  - `groups lessons 1-10, 11-20 and 21-30 under Foundation, Growth and Freedom`.
  - `every table-of-contents link targets an existing id`.
  - `Start Level 1 points at the app`.
  - `contains no internal planning language`: the `<main>` text does not match `/planned education module|we will build|do not isolate|do not ask the user/i`.
- [ ] **Step 2: Run** `pnpm --filter website test -- Course`. Expected: FAIL.
- [ ] **Step 3: Implement** `Course.tsx`. Each lesson row shows number, title, "Tool in the app" and "Action". Rewrite the internal-voice sentences for visitors; copy lesson data exactly.
- [ ] **Step 4: Run** the website tests. Expected: PASS.
- [ ] **Step 5: Commit** `feat(website): public Course page with the 30-lesson map`.

### Task 7: Home entry points and trust strip

**Files:**
- Modify: `apps/website/src/pages/Home.tsx`, `apps/website/src/pages/Home.test.tsx`

**Interfaces:**
- Consumes: `Link` from `react-router-dom`, `usePageMeta`.
- Produces: directly below the existing hero, a section of three entry cards linking to `/why` ("Why it exists"), `/guide` ("See a real household"), `/course` ("Learn the course"), then a trust strip with three short statements: your numbers stay in your account; forecasts are educational; no brokerage or e-filing. `Home` calls `usePageMeta` with the same title and description already in `index.html`. All existing sections and the existing `Home` test assertions stay.

- [ ] **Step 1: Add failing tests** to `Home.test.tsx`: `links to the Why, Guide and Course pages` (three links by name with hrefs `/why`, `/guide`, `/course`) and `shows the trust strip statements`.
- [ ] **Step 2: Run** `pnpm --filter website test -- Home`. Expected: the new tests FAIL; the original still passes.
- [ ] **Step 3: Implement** the entry cards and trust strip in `Home.tsx`, reusing the existing card styling. Do not move or delete existing sections.
- [ ] **Step 4: Run** the website tests. Expected: PASS.
- [ ] **Step 5: Commit** `feat(website): home entry points and trust strip`.

### Task 8: Docs and final verification

**Files:**
- Modify: `docs/PROJECT_SPEC.md` (marketing-site paragraph near line 146), `docs/DEVELOPMENT_PLAN.md` (new phase at the end of the file)

- [ ] **Step 1: Update `PROJECT_SPEC.md`:** state that `apps/website` serves `/`, `/why`, `/guide`, `/course`; list the shared components and `usePageMeta`; and note that these are the public copies, while `apps/web` keeps its own in-app copies of the three pages (still must not be imported by the website).
- [ ] **Step 2: Add `Phase W1 — Website overhaul`** to `DEVELOPMENT_PLAN.md` in the same format as the existing phases (Status, summary, Validate line with the real command output from Step 3). State the decisions: public-safe Why page, `apps/web` untouched, no API or dependency changes.
- [ ] **Step 3: Run the full checks and record the output:**
  - `pnpm --filter website test` → all files pass, exit 0.
  - `pnpm --filter website typecheck` → exit 0.
  - `pnpm --filter website lint` → 0 errors.
  - `pnpm --filter website build` → exit 0.
- [ ] **Step 4: Manual browser pass.** Run `pnpm --filter website dev` (port 8081). Check `/`, `/why`, `/guide`, `/course` at ~390 px and ~1280 px: menu works on phone, TOC sticky on desktop, no horizontal scroll, CTAs go to the app login, page refresh on each route loads. Report anything that could not be checked.
- [ ] **Step 5: Confirm scope:** `git status` shows changes only under `apps/website/` and the two docs files, and none under `apps/web`, `apps/api` or any `package.json`/lockfile.
- [ ] **Step 6: Commit** `docs: record website overhaul (phase W1)`.
