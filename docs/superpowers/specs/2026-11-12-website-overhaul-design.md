# Website overhaul: Why, Guide, Course and Home

Date: 2026-11-12
Status: Approved; revised 2026-11-12 after code check (see section 11)
Workspace: `apps/website` only (`apps/web` is not changed)

## 1. Intent

A first-time visitor should quickly understand why Freedom Planner exists, what it does, and how to start. The site has three jobs, in this order of priority:

1. **Convert**: the visitor signs up and enters their own numbers (the single primary CTA on every page).
2. **Build trust**: the visitor sees the problem, the objective, and the data/privacy stance.
3. **Teach**: the visitor learns money basics from the guide and course.

Pages named by the owner: `why.html`, `guide.html`, `course.html`. Today they are standalone static HTML files in `apps/web/src/pages/` (47 KB, 32 KB and 37 KB). The marketing site (`apps/website`) has only a Home page and links into the app for the guide.

### Success criteria

- `/why`, `/guide`, `/course` are routes in `apps/website`, using the shared header and footer.
- Each page has one job, a scannable structure, and the same sign-up CTA block.
- Every page links to the next page in the journey (Why, Guide, Course, App).
- Home gives three clear entry points and a trust strip.
- Existing facts are preserved: the problem statement, the Arjun Mehta household figures, and the 30-lesson / 3-level course outline. This is a clarity and structure pass, not new product claims.
- `apps/web` is untouched: its in-app copies of the three pages keep working.
- The public `/why` page contains no internal commercial plans (see 4.4).
- Tests, lint and typecheck pass for `apps/website`.

## 2. Constraints (from CLAUDE.md)

- `apps/website` has no auth store and must not import source from `apps/web`.
- No new dependencies, no stack changes. React 18, Vite, Tailwind, `react-router-dom`, `lucide-react` only.
- No changes to the API, Prisma, or the response envelope.
- Forecast and advice copy stays educational. Keep the existing disclaimers: no e-filing, brokerage or scheme distribution.
- Match the existing code style (`PageShell`, Tailwind tokens, `appUrl()` for links into the app).
- Do not reformat unrelated files.

## 3. Current state

- `apps/website/src/App.tsx`: routes `/` and `*` only.
- `apps/website/src/components/PageShell.tsx`: `SiteHeader`, `SiteFooter`, `PageShell`. Header anchors are on-page (`/#product`, and so on). The footer links to `appUrl("/guide")`.
- `apps/website/src/pages/Home.tsx` (396 lines): pillars, goals, steps, features, FAQ.
- Source content to migrate:
  - `why.html`: Problem statement, Objective, What the app does today, Vision (planner to decision platform), Business model, Trust, How to use this page.
  - `guide.html`: How to get started, the sample household (Arjun Mehta), what Arjun entered, what the dashboard did, problems the sample exposed, the plan of action, "Now enter your data".
  - `course.html`: Product loop, three levels, Level 1 Foundation, Level 2 Growth, Level 3 Freedom, what one lesson looks like, how to use this page.

## 4. Design

### 4.1 Routes and navigation

- Add routes `/why`, `/guide`, `/course` in `App.tsx`.
- Header nav: **Why · Guide · Course · Product · FAQ · Sign in**, plus the "Open the app" button. Product and FAQ stay as Home anchors.
- Highlight the active route in the nav. On small screens, show a menu button that reveals the same links (the header is currently hidden below `lg`).
- Footer: replace `appUrl("/guide")` with `/guide`; add Why and Course under "On this site".

### 4.2 Shared components (in `apps/website/src/components/`)

| Component | Purpose | Props |
| --- | --- | --- |
| `PageHero` | Page title, one-sentence promise, optional primary action | `eyebrow`, `title`, `lead`, `children` |
| `TableOfContents` | Sticky in-page section list for long pages (Why, Course) | `items: { id; label }[]` |
| `CtaBand` | Closing sign-up block plus a "next page" link | `next: { to; label }` |
| `usePageMeta` | Sets `document.title` and the meta description per route | `title`, `description` |

Each is small, has one purpose, and is tested through the pages that use it. No new abstractions beyond these four.

### 4.3 Home

- Hero with a one-line promise and the primary CTA.
- Three entry cards: *Why it exists* (`/why`), *See a real household* (`/guide`), *Learn the course* (`/course`).
- Trust strip: your numbers stay in your account, forecasts are educational, no brokerage or e-filing.
- Existing sections (pillars, goals, how it works, features, FAQ) stay below. No content removed.

### 4.4 Why (`/why`)

- Job: build trust. Order: Problem, Objective, What the app does today, Trust, How we stay on your side.
- Public-safe version (owner decision, 2026-11-12). `why.html` is an internal brief. The public page keeps Problem, Objective, What the app does today and Trust. It leaves out the commission/referral/trail table, the partner economics, the flywheel, the "recommendation engine becomes the moat" section and the "financial decision and distribution platform" vision.
- "How we stay on your side" replaces the business-model section with one short statement that recommendations follow the customer's plan and that doing nothing can be the right answer. It makes no revenue claims and does not mention partners, commissions or distribution.
- Page copy must not contradict the Home disclaimers ("not a fund house", no brokerage or scheme distribution).
- Sticky table of contents on desktop. Short paragraphs, one idea per section, pull-quote for the problem statement.
- Ends with `CtaBand` (next: Guide).

### 4.5 Guide (`/guide`)

- Job: show, not tell. Walk through Arjun Mehta's household in numbered steps.
- Sections: the sample household, what Arjun entered (a card grid of the figures), what the dashboard did, the problems it exposed, the plan of action, then "Now enter your data".
- Present the problems and the plan as a before/after pair so the value is visible without reading the whole page.
- Figures are copied from `guide.html` unchanged; they are static content and not fetched from the API.
- Ends with `CtaBand` (next: Course).

### 4.6 Course (`/course`)

- Job: show the learning path. A visual map of 30 lessons across three levels (Foundation, Growth, Freedom), each level a card listing its lessons.
- Include the product loop (learn, apply to your numbers, review) and one example lesson.
- Sticky table of contents by level.
- Primary CTA: "Start Level 1" links to the app. Ends with `CtaBand` (next: App sign-up).
- Lesson titles are copied from `course.html` unchanged.

### 4.7 SEO and accessibility

- Per-route `<title>` and meta description via `usePageMeta`.
- One `<h1>` per page, ordered headings, visible focus states, link text that describes the destination.
- Respect the existing colour tokens so contrast is not regressed.

### 4.8 Relationship to the `apps/web` copies

- `apps/web` already renders `why.html`, `guide.html` and `course.html` through `?raw` imports and routes `/why.html`, `/guide.html` and `/course.html`. `Course` also shares the `fp-course-progress` localStorage key with `CourseModule`. None of that changes.
- The website gets new React pages (`Why.tsx`, `Guide.tsx`, `Course.tsx`) with section data as typed constants at the top of each file, matching `Home.tsx`. Facts (Arjun's figures, lesson titles) are copied from the HTML files; the website never imports from `apps/web`.
- No redirects and no deletions. Content now lives in two places; a note in `PROJECT_SPEC.md` records that the website copy is the public one and the `apps/web` copy is the in-app one.

## 5. Error handling

Static content only; there is no network I/O on these pages. Unknown routes still fall through to `NotFound`. If the app URL env var is missing, `appUrl()` behaviour is unchanged.

## 6. Testing

Vitest and Testing Library in `apps/website`, testing visible behaviour:

- Each route renders its `<h1>` and primary CTA, and the CTA `href` points at the app sign-in.
- Header nav links reach `/why`, `/guide` and `/course`, and the active link is marked `aria-current`.
- Course page shows 3 levels and 30 lessons; Guide page shows the Arjun household figures.
- `usePageMeta` sets the document title per route.

Verification before completion: `pnpm --filter website test`, lint, and typecheck (`tsc`), plus a manual visual pass in a browser at phone and desktop widths.

## 7. Docs

- `docs/PROJECT_SPEC.md`: update the marketing-site section (routes, new components).
- `docs/DEVELOPMENT_PLAN.md`: add a phase entry for this work.

## 8. Out of scope

- Any change to `apps/web`, including its HTML pages and the course progress sync.
- Publishing the commercial model or rewording the Home disclaimers.
- New pages (Pricing, Blog, Contact), analytics, a CMS, i18n, and any API or backend change.
- Rewriting product claims. Any content that looks outdated is flagged in the plan for the owner to decide.
- Adding Playwright, Prettier, or any dependency.

## 9. Delivery order

1. Routing, header/footer, shared components, `usePageMeta`.
2. Why.
3. Guide.
4. Course.
5. Home polish.
6. Docs and final verification.

Each step ends with tests, lint and typecheck passing.

## 10. Open questions

None.

## 11. Revision note

The first draft proposed replacing the `apps/web` HTML files with redirects and publishing all of `why.html`. A code check showed `apps/web` serves them in-app (and shares course progress), and that `why.html` is an internal brief with commission economics that conflicts with the site's disclaimers. The owner chose to keep the `apps/web` copies untouched and publish a public-safe Why page.
