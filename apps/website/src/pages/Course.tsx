import { PageShell } from "@/components/PageShell";
import { PageHero } from "@/components/PageHero";
import { TableOfContents } from "@/components/TableOfContents";
import { CtaBand } from "@/components/CtaBand";
import { usePageMeta } from "@/lib/usePageMeta";
import { appUrl } from "@/lib/utils";

const PAGE_TITLE = "Financial Freedom Journey: 30 lessons in Freedom Planner";
const PAGE_DESCRIPTION =
  "Thirty short lessons in three levels that teach money basics and send you back into your own numbers, with a quick check on each.";

const toc = [
  { id: "foundation", label: "Level 1: Foundation" },
  { id: "growth", label: "Level 2: Growth" },
  { id: "freedom", label: "Level 3: Freedom" },
];

interface Lesson {
  n: number;
  title: string;
  tool: string;
  action: string;
}

interface CourseModule {
  title: string;
  lessons: Lesson[];
}

interface Level {
  id: "foundation" | "growth" | "freedom";
  title: string;
  summary: string;
  goal: string;
  modules: CourseModule[];
}

const loop = {
  lead: "Every lesson follows the same five steps: learn the concept, understand it, look at your own finances, use a Freedom Planner tool, take action, and track the improvement before moving to the next concept. You do not have to take lessons 1 to 30 in order. Each lesson ends with a short check, and your progress is saved as you go.",
  steps: [
    { title: "Learn", body: "A 5–8 minute concept." },
    { title: "Check", body: "A short understanding check." },
    { title: "Apply", body: "Use the income, EMIs and SIPs you already entered." },
    { title: "Act", body: "Create a goal or change a plan." },
    { title: "Track", body: "Watch the gap close in the app." },
  ],
  note: "Lessons sit inside the app rather than in a separate course site. They use Financial Health, cash flow, loans, insurance, SIPs, goals, retirement, FIRE, the Freedom Score, calculators, and the AI advisor, and they reuse the numbers you have already entered, so you do not enter them again.",
};

const levels: Level[] = [
  {
    id: "foundation",
    title: "Foundation",
    summary:
      "Take control of your money. Understand the current situation and build a base: cash flow, budget, emergency fund, first debt plan. Lessons 1–10.",
    goal: "Know where the money is and stop the leaks before chasing returns.",
    modules: [
      {
        title: "Module 1: Money mindset",
        lessons: [
          { n: 1, title: "What does financial freedom mean?", tool: "Financial Freedom Score", action: "Define a freedom goal" },
          { n: 2, title: "Understand your money", tool: "Financial snapshot", action: "Complete the financial profile" },
          { n: 3, title: "Understand your cash flow", tool: "Cash-flow analyzer", action: "Identify monthly surplus or deficit" },
        ],
      },
      {
        title: "Module 2: Budgeting",
        lessons: [
          { n: 4, title: "How budgeting actually works (50/30/20, zero-based, needs vs wants)", tool: "Budget planner", action: "Create a monthly budget" },
          { n: 5, title: "Find where your money is going", tool: "Expense analyzer", action: "Pick three expenses to reduce" },
        ],
      },
      {
        title: "Module 3: Emergency fund",
        lessons: [
          { n: 6, title: "What is an emergency fund?", tool: "Emergency fund calculator", action: "Set a target (example: 6 months of essentials)" },
          { n: 7, title: "Build your emergency fund", tool: "Emergency fund goal", action: "Create the goal and start funding it" },
        ],
      },
      {
        title: "Module 4: Debt",
        lessons: [
          { n: 8, title: "Understanding loans (principal, EMI, tenure, amortization)", tool: "Loan analyzer", action: "See total interest on current loans" },
          { n: 9, title: "Good debt vs bad debt", tool: "Debt health analyzer", action: "Read debt-to-income against the household" },
          { n: 10, title: "Your first debt-freedom plan (avalanche, snowball, prepay)", tool: "Debt freedom planner", action: "Choose a repayment strategy" },
        ],
      },
    ],
  },
  {
    id: "growth",
    title: "Growth",
    summary:
      "Build and protect wealth. Credit, interest burden, insurance, saving vs investing, inflation, SIP and asset classes. Lessons 11–20.",
    goal: "Protect the household and put surplus to work. Education stays neutral, with no promised returns.",
    modules: [
      {
        title: "Module 1: Credit and debt optimization",
        lessons: [
          { n: 11, title: "Understanding credit scores", tool: "Debt health / loans", action: "See how utilisation and EMIs show up in the plan" },
          { n: 12, title: "How credit cards really work", tool: "Credit cards on Manage", action: "Review revolved balances vs pay-in-full" },
          { n: 13, title: "Reduce your interest burden", tool: "Loan optimizer, prepayment, consolidation calculators", action: "Model a prepay vs continue-SIP trade-off" },
        ],
      },
      {
        title: "Module 2: Insurance",
        lessons: [
          { n: 14, title: "Why insurance is financial protection", tool: "Insurance coverage checker", action: "Compare current cover vs estimated need" },
          { n: 15, title: "Health insurance", tool: "Family protection calculator", action: "Note gaps; no product push without disclosure" },
          { n: 16, title: "Life and term insurance", tool: "Coverage checker", action: "Same comparison for term cover" },
        ],
      },
      {
        title: "Module 3: Investing",
        lessons: [
          { n: 17, title: "Saving vs investing", tool: "Investments + emergency fund", action: "Split liquid buffer from long-term SIPs" },
          { n: 18, title: "Understanding inflation", tool: "Inflation calculator", action: "See today’s rupee vs retirement-year rupee" },
          { n: 19, title: "Compound interest", tool: "Investment growth / lumpsum", action: "Run a labelled assumption, not a promise" },
          { n: 20, title: "Mutual funds, SIP, and asset classes", tool: "SIP calculator", action: "Map existing SIPs; do not guarantee returns" },
        ],
      },
    ],
  },
  {
    id: "freedom",
    title: "Freedom",
    summary:
      "Path to independence. Goals, retirement corpus, FIRE variants, freedom rate, and a personal roadmap. Lessons 21–30.",
    goal: "A written path to independence. FIRE is taught as variants (Lean, Regular, Fat, Coast), not as the only right life.",
    modules: [
      {
        title: "Module 1: Financial goals",
        lessons: [
          { n: 21, title: "How to set financial goals", tool: "Goal planner", action: "Write one funded goal from real surplus" },
          { n: 22, title: "Short-, medium-, and long-term goals", tool: "Goals", action: "Place existing goals on a timeline" },
          { n: 23, title: "Planning large expenses", tool: "Goal projection calculator", action: "Size a house / education / wedding target" },
        ],
      },
      {
        title: "Module 2: Retirement",
        lessons: [
          { n: 24, title: "Why retirement planning starts early", tool: "Freedom calculator", action: "See years left vs corpus gap" },
          { n: 25, title: "Understanding retirement inflation", tool: "Profile inflation + retirement tools", action: "Keep inflation as an explicit assumption" },
          { n: 26, title: "How much do you need for retirement?", tool: "Retirement corpus planner", action: "Set a corpus target from expenses × multiple" },
        ],
      },
      {
        title: "Module 3: FIRE",
        lessons: [
          { n: 27, title: "What is FIRE? (Lean, Regular, Fat, Coast)", tool: "Freedom calculator path toggle", action: "Pick a path without treating it as universal" },
          { n: 28, title: "Calculate your FIRE number", tool: "FIRE calculator", action: "See estimated FIRE age vs current investments" },
          { n: 29, title: "Increase your financial-freedom rate", tool: "Financial freedom simulator", action: "Model savings rate, income, debt, and SIPs" },
          { n: 30, title: "Create your financial-freedom roadmap", tool: "Advisor + goals + forecast", action: "Leave with priorities, actions, and a projection" },
        ],
      },
    ],
  },
];

const example = {
  lead: "Every lesson has the same shape. Here is “What is an emergency fund?” (lesson 6) as an example.",
  steps: [
    { title: "Learn", body: "A short lesson on why a buffer exists, emergency vs non-emergency spending, and liquidity." },
    { title: "Check", body: "A quick question, for example how many months of essential expenses a fund generally covers." },
    {
      title: "Apply",
      body: "The app pulls your essential expenses from your household and shows target vs current vs gap. For example, a target of ₹3,60,000 with ₹1,20,000 saved leaves a gap of ₹2,40,000.",
    },
    { title: "Act", body: "Create the goal “Build ₹2,40,000 emergency fund” from that gap." },
    { title: "Track", body: "Your progress is saved as you complete each lesson check, and you can take lessons in any order." },
  ],
  disclaimer:
    "The course is educational, not personal financial advice, and the figures above are an example, not a promise of any result.",
};

function StepList({ steps }: { steps: { title: string; body: string }[] }) {
  return (
    <ol className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-5">
      {steps.map((step, index) => (
        <li key={step.title} className="rounded-2xl border border-border bg-card p-6 shadow-card">
          <p className="font-display text-sm font-bold text-primary">{index + 1}</p>
          <h3 className="mt-2 font-display text-lg font-semibold">{step.title}</h3>
          <p className="mt-2 text-sm text-muted-foreground">{step.body}</p>
        </li>
      ))}
    </ol>
  );
}

function ModuleTable({ module }: { module: CourseModule }) {
  const first = module.lessons[0]?.n;
  const last = module.lessons[module.lessons.length - 1]?.n;
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[34rem] text-left text-sm">
        <caption className="pb-3 text-left font-display text-base font-semibold">
          {module.title}
          <span className="ml-2 text-sm font-normal text-muted-foreground">
            {first === last ? `Lesson ${first}` : `Lessons ${first}–${last}`}
          </span>
        </caption>
        <thead>
          <tr className="border-b border-border text-muted-foreground">
            <th scope="col" className="w-10 py-2 font-medium">
              #
            </th>
            <th scope="col" className="py-2 pr-3 font-medium">
              Lesson
            </th>
            <th scope="col" className="py-2 pr-3 font-medium">
              Tool in the app
            </th>
            <th scope="col" className="py-2 font-medium">
              Action
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {module.lessons.map((lesson) => (
            <tr key={lesson.n} className="align-top">
              <td className="py-3 font-display font-bold text-primary">{lesson.n}</td>
              <th scope="row" className="py-3 pr-3 font-medium">
                {lesson.title}
              </th>
              <td className="py-3 pr-3 text-muted-foreground">{lesson.tool}</td>
              <td className="py-3 text-muted-foreground">{lesson.action}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default function Course() {
  usePageMeta(PAGE_TITLE, PAGE_DESCRIPTION);

  return (
    <PageShell>
      <PageHero
        eyebrow="Financial Freedom Journey"
        title="Thirty lessons that teach money, then send you back into your own numbers"
        lead="Each lesson in Freedom Planner explains a concept, checks your understanding, applies it to the household already in the app, and ends with an action: a goal, a budget change, or a debt plan. It is built into the app, not a video campus on the side."
      >
        <a
          href={appUrl("/login")}
          className="rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground shadow-card hover:opacity-95"
        >
          Start Level 1
        </a>
      </PageHero>

      <div className="container grid gap-12 py-16 lg:grid-cols-[14rem_minmax(0,1fr)]">
        <TableOfContents items={toc} />

        <div className="min-w-0 space-y-16">
          <section id="loop" className="scroll-mt-24">
            <h2 className="font-display text-3xl font-bold">How every lesson works</h2>
            <p className="mt-4 max-w-3xl text-muted-foreground">{loop.lead}</p>
            <StepList steps={loop.steps} />
            <p className="mt-6 max-w-3xl text-sm text-muted-foreground">{loop.note}</p>
          </section>

          <section aria-labelledby="levels-heading" className="scroll-mt-24">
            <h2 id="levels-heading" className="font-display text-3xl font-bold">
              Three levels
            </h2>
            <p className="mt-4 max-w-3xl text-muted-foreground">
              Foundation, Growth, and Freedom: roughly beginner, intermediate, and advanced, with about ten lessons each.
            </p>
            <ul className="mt-8 grid gap-5 md:grid-cols-3">
              {levels.map((level, index) => (
                <li key={level.id} className="rounded-2xl border border-border bg-card p-6 shadow-card">
                  <p className="font-display text-sm font-bold text-primary">{`Level ${index + 1}`}</p>
                  <h3 className="mt-1 font-display text-xl font-semibold">{level.title}</h3>
                  <p className="mt-2 text-sm text-muted-foreground">{level.summary}</p>
                </li>
              ))}
            </ul>
          </section>

          <div id="levels" className="space-y-16">
            {levels.map((level, index) => (
              <section key={level.id} id={level.id} className="scroll-mt-24">
                <p className="font-display text-sm font-bold uppercase tracking-wide text-primary">{`Level ${index + 1}`}</p>
                <h2 className="mt-1 font-display text-3xl font-bold">{level.title}</h2>
                <p className="mt-4 max-w-3xl text-muted-foreground">
                  <span className="font-semibold text-foreground">Goal: </span>
                  {level.goal}
                </p>
                <div className="mt-8 space-y-6">
                  {level.modules.map((module) => (
                    <div key={module.title} className="rounded-2xl border border-border bg-card p-6 shadow-card">
                      <ModuleTable module={module} />
                    </div>
                  ))}
                </div>
              </section>
            ))}
          </div>

          <section id="example" className="scroll-mt-24">
            <h2 className="font-display text-3xl font-bold">What one lesson looks like</h2>
            <p className="mt-4 max-w-3xl text-muted-foreground">{example.lead}</p>
            <StepList steps={example.steps} />
            <p className="mt-6 max-w-3xl rounded-2xl border border-border bg-muted/50 p-5 text-sm text-muted-foreground">
              {example.disclaimer}
            </p>
          </section>
        </div>
      </div>

      <CtaBand next={{ to: "/", label: "Back to the home page" }} />
    </PageShell>
  );
}
