import { PageShell } from "@/components/PageShell";
import { PageHero } from "@/components/PageHero";
import { TableOfContents } from "@/components/TableOfContents";
import { CtaBand } from "@/components/CtaBand";
import { usePageMeta } from "@/lib/usePageMeta";

const PAGE_TITLE = "Why Freedom Planner exists";
const PAGE_DESCRIPTION =
  "The problem Freedom Planner solves, what the app does today, and how it stays on your side.";

const toc = [
  { id: "problem", label: "The problem" },
  { id: "objective", label: "What it is for" },
  { id: "today", label: "What it does today" },
  { id: "trust", label: "Trust" },
  { id: "your-side", label: "How we stay on your side" },
];

const problem = {
  intro:
    "Most households already have the pieces of a financial life. What they do not have is one place that turns those pieces into answers they can use.",
  exact:
    "A salaried or self-employed adult in India often cannot see, in one place, what is left after EMIs and SIPs, whether debt and insurance match their income and dependents, whether investments fund their goals and retirement date, or which tax regime is cheaper for their year.",
  rows: [
    { lives: "Salary in the bank app", missing: "True monthly surplus after EMIs, premiums, and SIPs" },
    { lives: "EMIs in another app or a spreadsheet", missing: "Debt burden, and which loan is the expensive one" },
    { lives: "SIPs on a broker or fund-house site", missing: "Whether the portfolio actually funds the dated goal" },
    { lives: "Policy PDFs in email", missing: "Cover against income, dependents, and outstanding loans" },
    { lives: "Tax in a spreadsheet or last year's return", missing: "Old versus new regime with this year's deductions" },
    { lives: "Advice from relatives, videos, or a relationship manager", missing: "A plan tied to your numbers" },
  ],
  summary:
    "The problem is not that people lack apps. They have too many fragments and no single view of the household.",
  causes:
    "Without that view, surplus, emergency months, insurance adequacy, and the retirement year stay guesses. A new job, EMI, dependent, or goal does not automatically update the plan.",
  notFirst:
    "Freedom Planner does not start with live bank login, KYC, tax filing, or a marketplace. The first job is a trusted financial picture that helps you decide better.",
};

const objective = {
  lead: "Give you a living financial picture, then turn it into a forecast and a plan of action computed from your own records rather than guessed in a chat.",
  steps: [
    {
      title: "Capture the household",
      body: "Profile, income, expenses, loans, investments, insurance, an emergency fund, one FIRE path (Lean, Fat, or Coast), and other goals. Defaults: rupees, 6% inflation, retirement at 60.",
    },
    {
      title: "Show one picture",
      body: "Net worth, surplus, debt-to-income, coverage, and goal progress on a dashboard. Bank or UPI statements become categorised lines, and tax compares the old and new regimes for your year.",
    },
    {
      title: "Project and advise",
      body: "A deterministic cash-flow and net-worth engine produces the picture. A structured AI advisor then explains it and points to actions such as reducing expensive debt, completing the emergency fund, or closing a protection gap.",
    },
  ],
  who: "Salaried or self-employed adults in India who want to work toward FIRE, a house, education funding, better debt management, appropriate protection, or simply more control over their money.",
  done: "You finish setup, see a coherent dashboard built from your saved records, regenerate the advisor report when your numbers change, and download it as a PDF.",
};

const today = {
  lead: "This is the working product today.",
  surfaces: [
    { title: "Manage", body: "Income, expenses, loans, credit cards, investments, insurance, and goals." },
    { title: "Plan", body: "Statement analyser, budget tracker, AI advisor, and learning hub." },
  ],
  flow: "You sign up with an OTP, complete Quick Setup, then move through Overview, Manage, Plan, Calculators, and Report. The Guide page walks through a sample household.",
};

const trust = {
  lead: "A planning tool is only useful if you can rely on the numbers and know what happens to them.",
  points: [
    {
      title: "Where your numbers live",
      body: "This website does not store your finances. Your records are kept in your signed-in Freedom Planner account, although insurance and some extras may still live on your device until they are fully moved to the account.",
    },
    {
      title: "A deterministic planner under the advice",
      body: "Forecasts come from a deterministic planner working on your own entries. The AI advisor report is built from that same planner snapshot rather than from a generic article.",
    },
    {
      title: "Forecasts are educational",
      body: "Projections and calculators are what-ifs to help you think. They are not a guarantee of returns, and they do not change your saved loans or investments.",
    },
    {
      title: "No brokerage, no e-filing",
      body: "Freedom Planner does not execute SIPs, hold your money, or file your tax return. You keep your existing bank and fund accounts.",
    },
  ],
};

const yourSide = [
  "Anything the app suggests follows from your plan and your numbers.",
  "Sometimes the right answer is to do nothing: if your emergency fund is complete, your cover is adequate, and your surplus is healthy, the app should say so rather than invent an action.",
];

export default function Why() {
  usePageMeta(PAGE_TITLE, PAGE_DESCRIPTION);

  return (
    <PageShell>
      <PageHero
        eyebrow="Why Freedom Planner"
        title="One clear picture of your household money"
        lead="Your money is scattered across apps, PDFs, and spreadsheets. Freedom Planner brings it together so you can plan from facts."
      />

      <div className="container grid gap-12 py-16 lg:grid-cols-[14rem_minmax(0,1fr)]">
        <TableOfContents items={toc} />

        <div className="max-w-3xl space-y-16">
          <section id="problem" className="scroll-mt-24">
            <h2 className="font-display text-3xl font-bold">The problem</h2>
            <p className="mt-4 text-muted-foreground">{problem.intro}</p>
            <p className="mt-4 text-muted-foreground">{problem.exact}</p>
            <div className="mt-8 overflow-hidden rounded-2xl border border-border bg-card shadow-card">
              <div className="hidden grid-cols-2 gap-4 border-b border-border bg-muted/50 px-5 py-3 text-sm font-semibold sm:grid">
                <p>Where it lives today</p>
                <p>What you still cannot see</p>
              </div>
              <ul className="divide-y divide-border">
                {problem.rows.map((row) => (
                  <li key={row.lives} className="grid gap-1 px-5 py-4 text-sm sm:grid-cols-2 sm:gap-4">
                    <p className="font-medium">{row.lives}</p>
                    <p className="text-muted-foreground">{row.missing}</p>
                  </li>
                ))}
              </ul>
            </div>
            <p className="mt-6 text-muted-foreground">{problem.summary}</p>
            <h3 className="mt-8 font-display text-xl font-semibold">What that causes</h3>
            <p className="mt-2 text-muted-foreground">{problem.causes}</p>
            <h3 className="mt-8 font-display text-xl font-semibold">What we are not solving first</h3>
            <p className="mt-2 text-muted-foreground">{problem.notFirst}</p>
          </section>

          <section id="objective" className="scroll-mt-24">
            <h2 className="font-display text-3xl font-bold">What the app is for</h2>
            <p className="mt-4 text-muted-foreground">{objective.lead}</p>
            <ol className="mt-8 grid gap-5 sm:grid-cols-3">
              {objective.steps.map((step, index) => (
                <li key={step.title} className="rounded-2xl border border-border bg-card p-6 shadow-card">
                  <p className="font-display text-sm font-bold text-primary">{`0${index + 1}`}</p>
                  <h3 className="mt-2 font-display text-lg font-semibold">{step.title}</h3>
                  <p className="mt-2 text-sm text-muted-foreground">{step.body}</p>
                </li>
              ))}
            </ol>
            <h3 className="mt-8 font-display text-xl font-semibold">Who it is for</h3>
            <p className="mt-2 text-muted-foreground">{objective.who}</p>
            <h3 className="mt-8 font-display text-xl font-semibold">What done looks like</h3>
            <p className="mt-2 text-muted-foreground">{objective.done}</p>
          </section>

          <section id="today" className="scroll-mt-24">
            <h2 className="font-display text-3xl font-bold">What the app does today</h2>
            <p className="mt-4 text-muted-foreground">{today.lead}</p>
            <div className="mt-8 grid gap-5 sm:grid-cols-2">
              {today.surfaces.map((surface) => (
                <article key={surface.title} className="rounded-2xl border border-border bg-card p-6 shadow-card">
                  <h3 className="font-display text-lg font-semibold">{surface.title}</h3>
                  <p className="mt-2 text-sm text-muted-foreground">{surface.body}</p>
                </article>
              ))}
            </div>
            <p className="mt-6 text-muted-foreground">{today.flow}</p>
          </section>

          <section id="trust" className="scroll-mt-24">
            <h2 className="font-display text-3xl font-bold">Trust</h2>
            <p className="mt-4 text-muted-foreground">{trust.lead}</p>
            <div className="mt-8 grid gap-5 sm:grid-cols-2">
              {trust.points.map((point) => (
                <article key={point.title} className="rounded-2xl border border-border bg-card p-6 shadow-card">
                  <h3 className="font-display text-lg font-semibold">{point.title}</h3>
                  <p className="mt-2 text-sm text-muted-foreground">{point.body}</p>
                </article>
              ))}
            </div>
          </section>

          <section id="your-side" className="scroll-mt-24">
            <h2 className="font-display text-3xl font-bold">How we stay on your side</h2>
            {yourSide.map((paragraph) => (
              <p key={paragraph} className="mt-4 text-muted-foreground">
                {paragraph}
              </p>
            ))}
          </section>
        </div>
      </div>

      <CtaBand next={{ to: "/guide", label: "See a real household" }} />
    </PageShell>
  );
}
