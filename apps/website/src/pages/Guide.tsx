import { PageShell } from "@/components/PageShell";
import { PageHero } from "@/components/PageHero";
import { TableOfContents } from "@/components/TableOfContents";
import { CtaBand } from "@/components/CtaBand";
import { usePageMeta } from "@/lib/usePageMeta";

const PAGE_TITLE = "How Freedom Planner works: the Arjun Mehta walkthrough";
const PAGE_DESCRIPTION =
  "Follow a fictional sample household from entered numbers to a dashboard, four clear problems, and a plan of action.";

const toc = [
  { id: "start", label: "Get started" },
  { id: "arjun", label: "Meet Arjun" },
  { id: "numbers", label: "His numbers" },
  { id: "dashboard", label: "The dashboard" },
  { id: "problems", label: "The problems" },
  { id: "plan", label: "The plan" },
  { id: "enter", label: "Your turn" },
];

interface TitledText {
  title: string;
  body: string;
}

interface Row {
  label: string;
  cells: string[];
}

interface FigureTable {
  caption: string;
  headers: string[];
  rows: Row[];
}

const start = {
  lead: "After you create an account, Quick Setup asks for a financial profile. Income, expenses, loans, investments, and insurance are optional on each step. An emergency fund and one FIRE path (Lean, Fat, or Coast) are required before you can finish.",
  steps: [
    {
      title: "Sign up with email and mobile OTP",
      body: "Your records are saved to your Freedom Planner account rather than kept in a spreadsheet.",
    },
    {
      title: "Complete Quick Setup",
      body: "Profile, income, expenses, loans, investments, insurance, emergency fund, FIRE path, and other goals.",
    },
    {
      title: "Read the dashboard",
      body: "Net worth, surplus, debt ratio, and a projected freedom date appear from the records you saved.",
    },
    {
      title: "Open the AI advisor and the report",
      body: "Suggestions are tied to your numbers, such as paying down costly debt, closing cover gaps, or keeping SIPs going when cash flow allows. They are educational, not personal advice.",
    },
  ] satisfies TitledText[],
};

const arjun = {
  lead: "Arjun is a 32-year-old salaried tech lead in India, with two dependents, a home loan, and a FIRE target at 55. The sample is fictional. It is sized so every part of the app has something to show: cash flow, debt, SIPs, cover, and goals.",
  cards: [
    {
      title: "Profile",
      body: "Age 32 · retire at 55 · salaried · 2 dependents · inflation 6% · currency ₹",
    },
    {
      title: "What he wanted",
      body: "A single view of surplus, whether EMIs are too high, if term cover is enough, and when FIRE is realistic.",
    },
    {
      title: "What was messy",
      body: "Salary, rent, SIPs, three loans, a life insurance policy, and school fees lived in memory. He could not see the trade-offs.",
    },
  ] satisfies TitledText[],
};

const numbers = {
  lead: "These are the figures in the sample household. Recurring expenses exclude the one-time Goa trip.",
  income: {
    heading: "Monthly income",
    total: "₹2,52,500",
    table: {
      caption: "Monthly income · ₹2,52,500",
      headers: ["Source", "Amount"],
      rows: [
        { label: "Tech Lead Salary", cells: ["₹1,85,000"] },
        { label: "Side consulting", cells: ["₹35,000"] },
        { label: "Apartment rent", cells: ["₹22,000"] },
        { label: "Dividends + FD interest", cells: ["₹10,500"] },
      ],
    } satisfies FigureTable,
  },
  outgo: {
    total: "₹1,48,967",
    table: {
      caption: "Monthly outgo · ₹1,48,967",
      headers: ["Bucket", "Amount"],
      rows: [
        { label: "Recurring expenses", cells: ["₹75,100"] },
        { label: "Loan EMIs", cells: ["₹67,700"] },
        { label: "Insurance premiums", cells: ["₹6,167"] },
        { label: "Surplus after those", cells: ["₹1,03,533"] },
      ],
    } satisfies FigureTable,
  },
  cashflowNote: "SIPs of ₹98,500 sit inside the surplus, not as a fourth deduction.",
  loans: {
    table: {
      caption: "Loans · ₹49.00 L outstanding",
      headers: ["Loan", "Rate", "EMI"],
      rows: [
        { label: "Home loan · ₹42.00 L", cells: ["8.5%", "₹42,000"] },
        { label: "Car loan · ₹4.80 L", cells: ["9.2%", "₹14,500"] },
        { label: "Personal loan · ₹2.20 L", cells: ["13.5%", "₹11,200"] },
      ],
    } satisfies FigureTable,
  },
  investments: {
    table: {
      caption: "Investments · ₹63.80 L",
      headers: ["Asset", "Value", "SIP"],
      rows: [
        { label: "Index MFs + stocks", cells: ["₹27.70 L", "₹50,000"] },
        { label: "EPF + PPF + NPS", cells: ["₹24.50 L", "₹39,500"] },
        { label: "Gold, FD, crypto", cells: ["₹11.60 L", "₹9,000"] },
      ],
    } satisfies FigureTable,
  },
  debtNote: "Debt cost and SIP size side by side. The 13.5% personal loan is the expensive outlier.",
  cards: [
    {
      title: "Protection",
      body: "Term ₹1.50 Cr · family floater ₹10 L · car cover ₹8 L. Health and car policies are close to expiry in the sample year.",
    },
    {
      title: "Safety buffer",
      body: "Emergency fund ₹4.80 L plus liquid ₹1.50 L. Against essentials plus EMIs this is about 4.8 months, short of the 6-month target for a salaried household.",
    },
    {
      title: "Goals",
      body: "Emergency fund, ₹6 Cr retirement, kids’ education ₹80 L, villa, vacation, and a car, plus a required FIRE path in Quick Setup.",
    },
  ] satisfies TitledText[],
};

const dashboard = {
  lead: "The app turns the records into net worth, savings rate, debt-to-income, and a projected freedom year. An empty account shows zeros. A filled household looks like this.",
  netWorth: {
    label: "Total net worth · Arjun Mehta",
    value: "₹19.60 L",
    detail: "₹68.60 L assets · ₹49.00 L liabilities",
  },
  pills: [
    { label: "Monthly surplus", value: "₹1.04 L" },
    { label: "Savings rate", value: "41%" },
    { label: "EMI / income", value: "27%" },
  ],
  note: "Savings rate is strong and EMIs are inside the 40% guideline. Net worth is still modest because the home loan is large compared with the investments.",
  healthy: {
    title: "What looked healthy",
    body: "41% savings rate (above the 20% floor of the 50-30-20 guideline). Debt-to-income 27% (under 40%). Eight investment types. SIPs of ₹98,500 already running. Term cover exists, even if it is short.",
  },
  flagged: {
    title: "What the gauges flagged",
    body: "Emergency fund about 4.8 of 6 months. Term ₹1.50 Cr against a target of about ₹5.04 Cr (15× income for two dependents, plus loans). Health cover ₹10 L against about ₹22.5 L for three people. Equity share about 46% against about 68% at age 32.",
  },
};

const problems = {
  lead: "Arjun felt “fine” because his salary was high. Seeing cash flow, the cost of debt, and protection as one picture changed that. That is the job of the sample: to show what to look at before you type your own data.",
  items: [
    {
      title: "Surplus was already spoken for",
      body: "₹1.04 L left over after expenses, EMIs, and premiums, but ₹98,500 already goes to SIPs. Almost no cash is left to fix the emergency gap or the expensive loan.",
    },
    {
      title: "One loan was much costlier",
      body: "Personal loan at 13.5% on ₹2.20 L. The home loan at 8.5% is cheaper than the 12% return assumed for equity, so paying off the home loan is not the first move.",
    },
    {
      title: "Cover did not match income",
      body: "Two dependents, ₹30.3 L annual income, ₹49 L debt. ₹1.50 Cr term and ₹10 L health leave a gap if income stops.",
    },
    {
      title: "Emergency fund was incomplete",
      body: "Essentials plus EMIs are about ₹1.32 L a month. Six months needs about ₹7.94 L. He has ₹6.30 L liquid and earmarked. Close, not done.",
    },
  ] satisfies TitledText[],
};

const plan = {
  lead: "The advisor report is built from your planner snapshot. For Arjun it points to a balanced plan: do not pause all SIPs just because debt exists, tackle the expensive loan, finish the safety buffer, and close the insurance gaps.",
  headline: "Keep investing. Fix the 13.5% loan, the 6-month buffer, and term cover first.",
  items: [
    {
      tag: "High",
      title: "Prepay the personal loan",
      body: "₹2.20 L at 13.5%, 22 months left. Redirect a slice of surplus (and the ₹4,000 crypto SIP if needed) until this EMI of ₹11,200 disappears. Do not treat the 8.5% home loan the same way.",
    },
    {
      tag: "High",
      title: "Lift term cover toward 15× income",
      body: "By a common rule of thumb, cover of ₹4.55 Cr to ₹6.06 Cr. Current term is ₹1.50 Cr. Add cover sized to income plus outstanding loans, then keep paying the existing SIPs.",
    },
    {
      tag: "Medium",
      title: "Finish the 6-month emergency fund",
      body: "Shortfall of about ₹1.64 L against the 6× essentials-plus-EMI target for a salaried household. A sample contribution of ₹25,000 a month closes it in a few months. Keep it in easy-to-reach, low-risk holdings rather than equity.",
    },
    {
      tag: "Medium",
      title: "Raise family health cover",
      body: "₹10 L floater against about ₹22.5 L suggested for three people. The sample policy expires soon, so renew and top up together. Car insurance is a date reminder, not a wealth lever.",
    },
    {
      tag: "Keep",
      title: "Continue scheduled SIPs after the buffer",
      body: "Debt-to-income is 27% and savings rate 41%. The home-loan rate is 8.5%. The plan does not require pausing index or EPF SIPs. After the personal loan is gone, that ₹11,200 can go toward equity, moving toward the age-32 allocation of about 68%.",
    },
  ],
  note: "Suggestions follow the debt-versus-investing rule the app uses: expensive debt first, not “stop every SIP”.",
  disclaimer:
    "This walkthrough is educational, not personal advice. Arjun’s household is a fictional sample, and forecasts are not a promise of returns. Check your lender’s prepayment rules and talk to a qualified adviser before you act on your own money.",
};

const enter = {
  lead: "Use this page as the map. In the app, add your own salary, EMIs, and SIPs. Do not copy Arjun’s rupees into your account. When Quick Setup is done, the dashboard, forecast, advisor, and PDF report all read from what you saved.",
};

function DataTable({ table }: { table: FigureTable }) {
  return (
    <table className="w-full text-left text-sm">
      <caption className="pb-3 text-left font-display text-base font-semibold">{table.caption}</caption>
      <thead>
        <tr className="border-b border-border text-muted-foreground">
          {table.headers.map((header, index) => (
            <th key={header} scope="col" className={`py-2 font-medium ${index > 0 ? "text-right" : ""}`}>
              {header}
            </th>
          ))}
        </tr>
      </thead>
      <tbody className="divide-y divide-border">
        {table.rows.map((row) => (
          <tr key={row.label}>
            <th scope="row" className="py-2 pr-3 font-normal">
              {row.label}
            </th>
            {row.cells.map((cell, index) => (
              <td key={`${row.label}-${index}`} className="py-2 text-right tabular-nums">
                {cell}
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  );
}

function TableCard({ table }: { table: FigureTable }) {
  return (
    <div className="rounded-2xl border border-border bg-card p-6 shadow-card">
      <DataTable table={table} />
    </div>
  );
}

function InfoCard({ title, body }: TitledText) {
  return (
    <article className="rounded-2xl border border-border bg-card p-6 shadow-card">
      <h3 className="font-display text-lg font-semibold">{title}</h3>
      <p className="mt-2 text-sm text-muted-foreground">{body}</p>
    </article>
  );
}

export default function Guide() {
  usePageMeta(PAGE_TITLE, PAGE_DESCRIPTION);

  return (
    <PageShell>
      <PageHero
        eyebrow="Sample walkthrough"
        title="See Freedom Planner with Arjun Mehta’s household first"
        lead="Freedom Planner turns income, EMIs, SIPs, insurance, and goals into a net-worth picture, a forecast, and a plan of action. This page uses a fictional sample household so you can learn the screens before entering your own numbers."
      />

      <div className="container grid gap-12 py-16 lg:grid-cols-[14rem_minmax(0,1fr)]">
        <TableOfContents items={toc} />

        <div className="min-w-0 space-y-16">
          <section id="start" className="max-w-3xl scroll-mt-24">
            <h2 className="font-display text-3xl font-bold">How to get started</h2>
            <p className="mt-4 text-muted-foreground">{start.lead}</p>
            <ol className="mt-8 grid gap-5 sm:grid-cols-2">
              {start.steps.map((step, index) => (
                <li key={step.title} className="rounded-2xl border border-border bg-card p-6 shadow-card">
                  <p className="font-display text-sm font-bold text-primary">{`0${index + 1}`}</p>
                  <h3 className="mt-2 font-display text-lg font-semibold">{step.title}</h3>
                  <p className="mt-2 text-sm text-muted-foreground">{step.body}</p>
                </li>
              ))}
            </ol>
          </section>

          <section id="arjun" className="max-w-3xl scroll-mt-24">
            <h2 className="font-display text-3xl font-bold">The sample household: Arjun Mehta</h2>
            <p className="mt-4 text-muted-foreground">{arjun.lead}</p>
            <div className="mt-8 grid gap-5 sm:grid-cols-3">
              {arjun.cards.map((card) => (
                <InfoCard key={card.title} {...card} />
              ))}
            </div>
          </section>

          <section id="numbers" className="scroll-mt-24">
            <h2 className="font-display text-3xl font-bold">What Arjun entered</h2>
            <p className="mt-4 max-w-3xl text-muted-foreground">{numbers.lead}</p>
            <div className="mt-8 grid gap-5 md:grid-cols-2">
              <TableCard table={numbers.income.table} />
              <TableCard table={numbers.outgo.table} />
            </div>
            <p className="mt-4 text-sm text-muted-foreground">{numbers.cashflowNote}</p>
            <div className="mt-8 grid gap-5 md:grid-cols-2">
              <TableCard table={numbers.loans.table} />
              <TableCard table={numbers.investments.table} />
            </div>
            <p className="mt-4 text-sm text-muted-foreground">{numbers.debtNote}</p>
            <div className="mt-8 grid gap-5 sm:grid-cols-3">
              {numbers.cards.map((card) => (
                <InfoCard key={card.title} {...card} />
              ))}
            </div>
          </section>

          <section id="dashboard" className="scroll-mt-24">
            <h2 className="font-display text-3xl font-bold">What the dashboard did with those numbers</h2>
            <p className="mt-4 max-w-3xl text-muted-foreground">{dashboard.lead}</p>
            <div className="mt-8 rounded-2xl border border-border bg-card p-6 shadow-card">
              <p className="text-sm text-muted-foreground">{dashboard.netWorth.label}</p>
              <p className="mt-1 font-display text-4xl font-bold">{dashboard.netWorth.value}</p>
              <p className="mt-1 text-sm text-muted-foreground">{dashboard.netWorth.detail}</p>
              <dl className="mt-6 grid gap-4 sm:grid-cols-3">
                {dashboard.pills.map((pill) => (
                  <div key={pill.label} className="rounded-xl bg-muted/50 px-4 py-3">
                    <dt className="text-sm text-muted-foreground">{pill.label}</dt>
                    <dd className="font-display text-xl font-semibold">{pill.value}</dd>
                  </div>
                ))}
              </dl>
            </div>
            <p className="mt-4 max-w-3xl text-sm text-muted-foreground">{dashboard.note}</p>
            <div className="mt-8 grid gap-5 md:grid-cols-2">
              <InfoCard {...dashboard.healthy} />
              <InfoCard {...dashboard.flagged} />
            </div>
          </section>

          <div className="grid gap-12 lg:grid-cols-2 lg:gap-8">
            <section id="problems" className="scroll-mt-24">
              <p className="font-display text-sm font-bold uppercase tracking-wide text-primary">Before</p>
              <h2 className="mt-1 font-display text-3xl font-bold">The problems the sample made obvious</h2>
              <p className="mt-4 text-muted-foreground">{problems.lead}</p>
              <ol className="mt-8 space-y-5">
                {problems.items.map((item, index) => (
                  <li key={item.title} className="rounded-2xl border border-border bg-card p-6 shadow-card">
                    <h3 className="font-display text-lg font-semibold">{`${index + 1}. ${item.title}`}</h3>
                    <p className="mt-2 text-sm text-muted-foreground">{item.body}</p>
                  </li>
                ))}
              </ol>
            </section>

            <section id="plan" className="scroll-mt-24">
              <p className="font-display text-sm font-bold uppercase tracking-wide text-primary">After</p>
              <h2 className="mt-1 font-display text-3xl font-bold">A plan of action</h2>
              <p className="mt-4 text-muted-foreground">{plan.lead}</p>
              <h3 className="mt-6 font-display text-xl font-semibold">{plan.headline}</h3>
              <ul className="mt-6 space-y-5">
                {plan.items.map((item) => (
                  <li key={item.title} className="rounded-2xl border border-border bg-card p-6 shadow-card">
                    <p className="text-xs font-semibold uppercase tracking-wide text-primary">{item.tag}</p>
                    <h4 className="mt-1 font-display text-lg font-semibold">{item.title}</h4>
                    <p className="mt-2 text-sm text-muted-foreground">{item.body}</p>
                  </li>
                ))}
              </ul>
              <p className="mt-6 text-sm text-muted-foreground">{plan.note}</p>
              <p className="mt-4 rounded-2xl border border-border bg-muted/50 p-5 text-sm text-muted-foreground">
                {plan.disclaimer}
              </p>
            </section>
          </div>

          <section id="enter" className="max-w-3xl scroll-mt-24">
            <h2 className="font-display text-3xl font-bold">Now enter your data</h2>
            <p className="mt-4 text-muted-foreground">{enter.lead}</p>
          </section>
        </div>
      </div>

      <CtaBand next={{ to: "/course", label: "Learn the course" }} />
    </PageShell>
  );
}
