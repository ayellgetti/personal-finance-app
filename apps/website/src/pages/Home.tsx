import {
  Calculator,
  Landmark,
  LineChart,
  Shield,
  Sparkles,
  Target,
  Wallet,
} from "lucide-react";
import { PageShell } from "@/components/PageShell";
import { appUrl } from "@/lib/utils";

const features = [
  {
    title: "Household picture",
    body: "Income, expenses, EMIs, SIPs, insurance, and goals in one place — not a spreadsheet you dread opening.",
    icon: Wallet,
  },
  {
    title: "Cash flow & net worth",
    body: "See surplus, debt burden, and how net worth moves as you pay down loans and invest.",
    icon: LineChart,
  },
  {
    title: "Loans & coverage",
    body: "Track EMIs and insurance so coverage gaps and debt load are visible, not guessed.",
    icon: Landmark,
  },
  {
    title: "Goals & retirement",
    body: "Defaults that fit India: ₹, 6% inflation, retirement at 60. Adjust them to your household.",
    icon: Target,
  },
  {
    title: "Deterministic planner",
    body: "Forecasts from your data, not a generic blog post. The math is the same every time you run it.",
    icon: Calculator,
  },
  {
    title: "AI advisor report",
    body: "A structured report tied to your numbers — surplus, risk, and next steps you can act on.",
    icon: Sparkles,
  },
];

const steps = [
  {
    n: "01",
    title: "Capture the household",
    body: "Add income, loans, investments, insurance, and goals. Start incomplete; fill in as you go.",
  },
  {
    n: "02",
    title: "Run the planner",
    body: "Get cash-flow and net-worth projections without waiting on a human advisor.",
  },
  {
    n: "03",
    title: "Ask the advisor",
    body: "Generate a report that uses those same figures so advice is specific, not generic.",
  },
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
              Freedom Planner is the product app for household finance: capture what you have, project cash
              flow and net worth, and turn that into a structured AI advisor report.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <a
                href={appUrl("/login")}
                className="rounded-full bg-white px-6 py-3 text-sm font-semibold text-[hsl(168_55%_18%)] shadow-elevated hover:bg-emerald-50"
              >
                Open Freedom Planner
              </a>
              <a
                href="#product"
                className="rounded-full border border-white/30 px-6 py-3 text-sm font-semibold text-white hover:bg-white/10"
              >
                What it does
              </a>
            </div>
          </div>
          <div className="rounded-2xl border border-white/15 bg-white/10 p-6 text-emerald-50 shadow-elevated backdrop-blur">
            <p className="text-sm font-medium text-emerald-200">What you stop guessing</p>
            <ul className="mt-4 space-y-3 text-sm">
              <li className="flex gap-3">
                <Shield className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
                Monthly surplus after EMIs and SIPs
              </li>
              <li className="flex gap-3">
                <Shield className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
                Debt burden versus income
              </li>
              <li className="flex gap-3">
                <Shield className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
                Insurance coverage gaps
              </li>
              <li className="flex gap-3">
                <Shield className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
                Retirement trajectory, not a slogan
              </li>
            </ul>
          </div>
        </div>
      </section>

      <section id="product" className="container py-20">
        <h2 className="font-display text-3xl font-bold">The product, not a brochure</h2>
        <p className="mt-3 max-w-2xl text-muted-foreground">
          This site is the public homepage. The live app — login, dashboard, planner, advisor — lives
          separately in the Freedom Planner web app.
        </p>
        <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((feature) => (
            <article key={feature.title} className="rounded-2xl border border-border bg-card p-6 shadow-card">
              <feature.icon className="h-6 w-6 text-primary" aria-hidden />
              <h3 className="mt-4 font-display text-lg font-semibold">{feature.title}</h3>
              <p className="mt-2 text-sm text-muted-foreground">{feature.body}</p>
            </article>
          ))}
        </div>
      </section>

      <section id="how" className="border-y border-border bg-muted/50 py-20">
        <div className="container">
          <h2 className="font-display text-3xl font-bold">How it works</h2>
          <ol className="mt-10 grid gap-8 md:grid-cols-3">
            {steps.map((step) => (
              <li key={step.n} className="rounded-2xl bg-card p-6 shadow-card">
                <p className="font-display text-sm font-bold text-primary">{step.n}</p>
                <h3 className="mt-2 font-display text-xl font-semibold">{step.title}</h3>
                <p className="mt-2 text-sm text-muted-foreground">{step.body}</p>
              </li>
            ))}
          </ol>
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
