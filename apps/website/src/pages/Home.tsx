import {
  Calculator,
  FileSpreadsheet,
  GraduationCap,
  Home as HomeIcon,
  Landmark,
  LineChart,
  Palmtree,
  PiggyBank,
  Shield,
  Sparkles,
  Target,
  Umbrella,
  Wallet,
} from "lucide-react";
import { PageShell } from "@/components/PageShell";
import { appUrl } from "@/lib/utils";

const pillars = [
  {
    title: "Visualise your financial health",
    body: "Income, EMIs, SIPs, insurance, and investments in one snapshot — surplus and debt burden instead of a spreadsheet you dread opening.",
    icon: LineChart,
  },
  {
    title: "A plan tied to your household",
    body: "Set life goals and a FIRE path. The planner projects cash flow and net worth from your numbers, the same way every time you run it.",
    icon: Target,
  },
  {
    title: "Advice from your figures, not a blog",
    body: "The AI advisor report uses the planner snapshot — surplus, risk, coverage gaps, and next steps you can act on.",
    icon: Sparkles,
  },
  {
    title: "Course-correct without guesswork",
    body: "Tax, SIP, EMI, and Freedom calculators are what-ifs. They do not silently change saved loans or investments.",
    icon: Calculator,
  },
];

const goals = [
  {
    title: "Emergency fund",
    icon: Umbrella,
    target: "6 months of essentials",
    detail: "Compulsory on every account. Know the gap before you add lifestyle goals.",
  },
  {
    title: "Child’s education",
    icon: GraduationCap,
    target: "Inflation-aware corpus",
    detail: "Pick a horizon and target. See the funding path against an inflation-adjusted amount.",
  },
  {
    title: "Dream home",
    icon: HomeIcon,
    target: "Down payment on a date",
    detail: "Treat the house as a dated goal, not a wish — then see what SIPs and surplus can cover.",
  },
  {
    title: "Retirement / FIRE",
    icon: PiggyBank,
    target: "Lean, FIRE, Coast, or Fat",
    detail: "India defaults: ₹, 6% inflation, retirement at 60. Choose a path in setup; refine it later.",
  },
];

const steps = [
  {
    n: "01",
    title: "Capture the household",
    body: "Income, expenses, loans, credit cards, investments, insurance, and dependents. Start incomplete; fill in as you go.",
  },
  {
    n: "02",
    title: "Define life goals",
    body: "Emergency fund is required. Choose Lean, Fat, or Coast FIRE, then add home, education, or travel goals.",
  },
  {
    n: "03",
    title: "Run the planner",
    body: "Deterministic cash-flow and net-worth forecasts — no waiting on a human advisor for the math.",
  },
  {
    n: "04",
    title: "Act and course-correct",
    body: "Ask the advisor, import statements, and use calculators when a raise, a new EMI, or a tax change lands.",
  },
];

const features = [
  {
    title: "Household picture",
    body: "Income, expenses, EMIs, SIPs, insurance, and goals in one place.",
    icon: Wallet,
  },
  {
    title: "Loans & credit cards",
    body: "Tenure left, outstanding, avalanche what-ifs, and amortization — cards count in surplus and net worth.",
    icon: Landmark,
  },
  {
    title: "Investments",
    body: "Corpus, contribution, and projected value per holding so SIPs are not just a standing instruction.",
    icon: LineChart,
  },
  {
    title: "Insurance coverage",
    body: "Type, cover, premium, and expiry so gaps are visible before a claim, not after.",
    icon: Shield,
  },
  {
    title: "Statements",
    body: "Bank or UPI files as PDF, Excel, CSV, or pasted text. Categorised lines — not live bank login.",
    icon: FileSpreadsheet,
  },
  {
    title: "India tax & tools",
    body: "Old vs new regime sheet, SIP, EMI, Freedom calculator, and more. Not e-filing.",
    icon: Calculator,
  },
];

const tools = [
  { name: "Tax calculator", blurb: "India old / new regime, surcharge with marginal relief, saved scenarios." },
  { name: "Freedom calculator", blurb: "Lean, FIRE, Coast, and Fat what-ifs from your expenses and age." },
  { name: "SIP & step-up SIP", blurb: "See corpus growth without changing the investments you already saved." },
  { name: "EMI & loan", blurb: "Prepayment and higher-EMI comparisons next to the repayment schedule." },
  { name: "Lumpsum & targets", blurb: "Future value, bond yield, stock return, IRR, and INR number-to-words." },
  { name: "Statement import", blurb: "Password-protected PDF or Excel supported. No OCR for scanned pages." },
];

const faqs = [
  {
    q: "Is this a mutual-fund app or a SIP seller?",
    a: "No. Freedom Planner is a household planning product. It does not execute SIPs, recommend a scheme, or custody money. You keep your existing bank and AMC.",
  },
  {
    q: "Where do my numbers live?",
    a: "In your signed-in account on the Freedom Planner app. This marketing site does not store finances. Insurance and some extras may still live on the device until they are fully on the API.",
  },
  {
    q: "What does the AI advisor use?",
    a: "The same planner snapshot as the forecasts — not a generic article. Reports are structured JSON, cached, and limited per account.",
  },
  {
    q: "Who is it for?",
    a: "Salaried or self-employed adults in India who want surplus, debt load, coverage, and a retirement trajectory in one place.",
  },
];

const snapshotRows = [
  { label: "Take-home (month)", value: "₹ 1,40,000" },
  { label: "EMIs", value: "₹ 38,000" },
  { label: "SIPs & premiums", value: "₹ 28,500" },
  { label: "Surplus after commitments", value: "₹ 18,400", emphasize: true },
];

export default function Home() {
  return (
    <PageShell>
      <section className="relative overflow-hidden">
        <div
          className="absolute inset-0 -z-10"
          style={{
            background: "linear-gradient(135deg, hsl(200 40% 14%) 0%, hsl(168 55% 22%) 100%)",
          }}
        />
        <div className="container grid gap-10 py-20 lg:grid-cols-2 lg:items-center lg:py-28">
          <div className="text-white">
            <p className="mb-3 text-sm font-semibold uppercase tracking-wider text-emerald-200">
              Built for salaried and self-employed adults in India
            </p>
            <h1 className="font-display text-4xl font-extrabold leading-tight sm:text-5xl">
              See your money clearly. Plan the path to freedom.
            </h1>
            <p className="mt-5 max-w-xl text-lg text-emerald-50/90">
              Aiming for early retirement, a home, or a calmer next decade? Capture the household, project
              cash flow and net worth, and turn that into a structured AI advisor report — without selling
              you a fund.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <a
                href={appUrl("/login")}
                className="rounded-full bg-white px-6 py-3 text-sm font-semibold text-[hsl(168_55%_18%)] shadow-elevated hover:bg-emerald-50"
              >
                Open Freedom Planner
              </a>
              <a
                href="#goals"
                className="rounded-full border border-white/30 px-6 py-3 text-sm font-semibold text-white hover:bg-white/10"
              >
                Explore life goals
              </a>
            </div>
            <p className="mt-6 text-sm text-emerald-100/80">
              Defaults that fit India: rupees, 6% inflation, retirement age 60. Adjust them to your household.
            </p>
          </div>
          <div className="rounded-2xl border border-white/15 bg-white/10 p-6 text-emerald-50 shadow-elevated backdrop-blur">
            <p className="text-sm font-medium text-emerald-200">Illustrative monthly snapshot</p>
            <p className="mt-1 text-xs text-emerald-100/70">
              Sample household — not live data. Your dashboard uses your own entries.
            </p>
            <dl className="mt-5 space-y-3 text-sm">
              {snapshotRows.map((row) => (
                <div key={row.label} className="flex items-baseline justify-between gap-4 border-b border-white/10 pb-3 last:border-0 last:pb-0">
                  <dt className="text-emerald-100/80">{row.label}</dt>
                  <dd className={row.emphasize ? "font-display text-base font-bold text-white" : "font-semibold"}>
                    {row.value}
                  </dd>
                </div>
              ))}
            </dl>
            <ul className="mt-5 space-y-2 text-sm">
              <li className="flex gap-2">
                <Shield className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
                Debt burden versus income
              </li>
              <li className="flex gap-2">
                <Shield className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
                Insurance coverage gaps
              </li>
              <li className="flex gap-2">
                <Shield className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
                Retirement trajectory, not a slogan
              </li>
            </ul>
          </div>
        </div>
      </section>

      <section className="border-b border-border bg-card py-6">
        <div className="container grid gap-4 text-center text-sm text-muted-foreground sm:grid-cols-3 sm:text-left">
          <p>
            <span className="font-display font-semibold text-foreground">One household.</span> Income,
            liabilities, and investments together.
          </p>
          <p>
            <span className="font-display font-semibold text-foreground">Deterministic math.</span> Same
            inputs, same forecast — then AI on top.
          </p>
          <p>
            <span className="font-display font-semibold text-foreground">Your existing SIPs.</span> We
            plan around them. We do not sell a scheme.
          </p>
        </div>
      </section>

      <section id="product" className="container py-20">
        <p className="text-sm font-semibold uppercase tracking-wider text-primary">Do more than set a goal</p>
        <h2 className="mt-2 font-display text-3xl font-bold">Financial planning for the whole picture</h2>
        <p className="mt-3 max-w-2xl text-muted-foreground">
          Snapshot first, then life goals, then a plan you can revisit — software you run yourself, not a
          one-time brochure.
        </p>
        <div className="mt-10 grid gap-5 sm:grid-cols-2">
          {pillars.map((pillar) => (
            <article key={pillar.title} className="rounded-2xl border border-border bg-card p-6 shadow-card">
              <pillar.icon className="h-6 w-6 text-primary" aria-hidden />
              <h3 className="mt-4 font-display text-lg font-semibold">{pillar.title}</h3>
              <p className="mt-2 text-sm text-muted-foreground">{pillar.body}</p>
            </article>
          ))}
        </div>
      </section>

      <section id="goals" className="border-y border-border bg-muted/50 py-20">
        <div className="container">
          <p className="text-sm font-semibold uppercase tracking-wider text-primary">Life goals</p>
          <h2 className="mt-2 font-display text-3xl font-bold">Plan the years that actually matter</h2>
          <p className="mt-3 max-w-2xl text-muted-foreground">
            Each goal has a target, a horizon, and a projection against inflation. Freedom Calculator is a
            separate what-if and does not overwrite the FIRE path you chose in setup.
          </p>
          <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {goals.map((goal) => (
              <article key={goal.title} className="rounded-2xl bg-card p-6 shadow-card">
                <goal.icon className="h-6 w-6 text-primary" aria-hidden />
                <h3 className="mt-4 font-display text-lg font-semibold">{goal.title}</h3>
                <p className="mt-1 text-sm font-medium text-primary">{goal.target}</p>
                <p className="mt-2 text-sm text-muted-foreground">{goal.detail}</p>
              </article>
            ))}
          </div>
          <div className="mt-10 rounded-2xl border border-border bg-card p-6 shadow-card md:flex md:items-center md:justify-between md:gap-8">
            <div>
              <h3 className="font-display text-xl font-semibold">Illustrative pair of targets</h3>
              <p className="mt-2 max-w-xl text-sm text-muted-foreground">
                Example only, using typical India assumptions (6% inflation, long equity-like return). Your
                planner uses the amounts and ages you enter — not this card.
              </p>
              <ul className="mt-4 space-y-2 text-sm">
                <li>
                  <Palmtree className="mr-2 inline h-4 w-4 text-primary" aria-hidden />
                  Vacation corpus in 3 years alongside the monthly surplus.
                </li>
                <li>
                  <GraduationCap className="mr-2 inline h-4 w-4 text-primary" aria-hidden />
                  College fund at the child’s age, inflated — not today’s fee brochure.
                </li>
              </ul>
            </div>
            <a
              href={appUrl("/login")}
              className="mt-6 inline-flex shrink-0 rounded-full bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground shadow-card md:mt-0"
            >
              Personalise my plan
            </a>
          </div>
        </div>
      </section>

      <section id="how" className="container py-20">
        <h2 className="font-display text-3xl font-bold">Getting started</h2>
        <p className="mt-3 max-w-2xl text-muted-foreground">
          Four steps from a messy household to a report you can act on. The live app — login, dashboard,
          planner, advisor — is Freedom Planner, not this page.
        </p>
        <ol className="mt-10 grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {steps.map((step) => (
            <li key={step.n} className="rounded-2xl border border-border bg-card p-6 shadow-card">
              <p className="font-display text-sm font-bold text-primary">{step.n}</p>
              <h3 className="mt-2 font-display text-xl font-semibold">{step.title}</h3>
              <p className="mt-2 text-sm text-muted-foreground">{step.body}</p>
            </li>
          ))}
        </ol>
      </section>

      <section className="border-y border-border bg-muted/50 py-20">
        <div className="container">
          <h2 className="font-display text-3xl font-bold">What you actually enter</h2>
          <p className="mt-3 max-w-2xl text-muted-foreground">
            The product is the capture surface plus the engines — planner, tax, calculators — not a brochure.
          </p>
          <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {features.map((feature) => (
              <article key={feature.title} className="rounded-2xl bg-card p-6 shadow-card">
                <feature.icon className="h-6 w-6 text-primary" aria-hidden />
                <h3 className="mt-4 font-display text-lg font-semibold">{feature.title}</h3>
                <p className="mt-2 text-sm text-muted-foreground">{feature.body}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section id="tools" className="container py-20">
        <h2 className="font-display text-3xl font-bold">Tools when the plan needs a tweak</h2>
        <p className="mt-3 max-w-2xl text-muted-foreground">
          Calculators sit in the app sidebar. Results stay on that screen unless you choose to save a
          scenario. Loans keep amortization on Manage → Loans.
        </p>
        <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {tools.map((tool) => (
            <article key={tool.name} className="rounded-2xl border border-border p-5">
              <h3 className="font-display font-semibold">{tool.name}</h3>
              <p className="mt-2 text-sm text-muted-foreground">{tool.blurb}</p>
            </article>
          ))}
        </div>
      </section>

      <section id="faq" className="border-t border-border bg-muted/50 py-20">
        <div className="container max-w-3xl">
          <h2 className="font-display text-3xl font-bold">Questions people ask before they sign in</h2>
          <dl className="mt-10 space-y-8">
            {faqs.map((item) => (
              <div key={item.q}>
                <dt>
                  <h3 className="font-display text-lg font-semibold">{item.q}</h3>
                </dt>
                <dd className="mt-2 text-sm text-muted-foreground">{item.a}</dd>
              </div>
            ))}
          </dl>
        </div>
      </section>

      <section className="container py-20 text-center">
        <h2 className="font-display text-3xl font-bold">Ready to use the app?</h2>
        <p className="mx-auto mt-3 max-w-xl text-muted-foreground">
          Sign in or create an account in Freedom Planner. This website does not store your finances.
        </p>
        <a
          href={appUrl("/login")}
          className="mt-8 inline-flex rounded-full bg-primary px-8 py-3 text-sm font-semibold text-primary-foreground shadow-card"
        >
          Go to login
        </a>
      </section>
    </PageShell>
  );
}
