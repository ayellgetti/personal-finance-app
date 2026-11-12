import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { fetchSharedPlan } from "@/lib/finance/plan-share-remote";
import { formatCurrency } from "@/lib/finance/calculations";
import type { SharedPlan as SharedPlanData } from "@/lib/finance/plan-snapshot";

type State = { kind: "loading" } | { kind: "gone" } | { kind: "ready"; plan: SharedPlanData };

/** Keep the shared page out of search results and stop it leaking its URL through the referrer. */
function useHiddenFromIndexing() {
  useEffect(() => {
    const tags = [
      Object.assign(document.createElement("meta"), { name: "robots", content: "noindex, nofollow" }),
      Object.assign(document.createElement("meta"), { name: "referrer", content: "no-referrer" }),
    ];
    tags.forEach((tag) => document.head.appendChild(tag));
    const previousTitle = document.title;
    document.title = "Shared plan";
    return () => {
      tags.forEach((tag) => tag.remove());
      document.title = previousTitle;
    };
  }, []);
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="mt-1 font-display text-xl font-semibold tabular-nums">{value}</p>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-2xl border border-border bg-card p-5">
      <h2 className="mb-3 font-display text-lg font-semibold">{title}</h2>
      {children}
    </section>
  );
}

export default function SharedPlan() {
  const { token = "" } = useParams();
  const [state, setState] = useState<State>({ kind: "loading" });
  useHiddenFromIndexing();

  useEffect(() => {
    let cancelled = false;
    fetchSharedPlan(token)
      .then((plan) => {
        if (!cancelled) setState({ kind: "ready", plan });
      })
      .catch(() => {
        // Unknown, expired and revoked links all look the same on purpose.
        if (!cancelled) setState({ kind: "gone" });
      });
    return () => {
      cancelled = true;
    };
  }, [token]);

  if (state.kind === "loading") {
    return (
      <main className="mx-auto max-w-3xl p-6">
        <p className="text-sm text-muted-foreground">Opening the shared plan…</p>
      </main>
    );
  }

  if (state.kind === "gone") {
    return (
      <main className="mx-auto max-w-xl p-6 text-center">
        <h1 className="font-display text-2xl font-bold">This link is no longer available</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          It may have expired or been withdrawn by the person who shared it. Ask them for a new link.
        </p>
      </main>
    );
  }

  const { snapshot: s, label, expiresAt } = state.plan;
  const cur = s.currency;
  const money = (value: number) => formatCurrency(value, cur, true);

  return (
    <main className="mx-auto max-w-3xl space-y-5 p-4 md:p-6">
      <header>
        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Freedom Planner · shared plan</p>
        <h1 className="mt-1 font-display text-2xl font-bold">{label}</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          A read-only snapshot as of {new Date(s.generatedAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}.
          It does not update. This link expires on{" "}
          {new Date(expiresAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}.
        </p>
      </header>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Stat label="Net worth" value={money(s.netWorth)} />
        <Stat label="Assets" value={money(s.assets)} />
        <Stat label="Liabilities" value={money(s.liabilities)} />
        <Stat label="Health score" value={`${s.healthScore.total} / 100`} />
        <Stat label="Monthly income" value={formatCurrency(s.monthlyIncome, cur)} />
        <Stat label="Monthly bills" value={formatCurrency(s.monthlyBills, cur)} />
        <Stat label="Savings rate" value={`${s.savingsRate}%`} />
        <Stat label="Emergency fund" value={`${s.emergency.months} of ${s.emergency.targetMonths} months`} />
      </div>

      <Section title="What the health score is made of">
        <ul className="space-y-2 text-sm">
          {s.healthScore.components.map((c) => (
            <li key={c.label} className="flex justify-between gap-3">
              <span>{c.label}</span>
              <span className="tabular-nums text-muted-foreground">{c.answered ? `${c.score} / 100` : "Not scored yet"}</span>
            </li>
          ))}
        </ul>
      </Section>

      {s.freedom ? (
        <Section title="Financial freedom">
          <p className="text-sm text-muted-foreground">
            A {s.freedom.mode} number of <span className="font-semibold text-foreground">{money(s.freedom.target)}</span>, with a projected
            corpus of <span className="font-semibold text-foreground">{money(s.freedom.projectedCorpus)}</span> by {s.freedom.targetYear}.
            These are estimates built on assumed returns and inflation.
          </p>
        </Section>
      ) : null}

      <Section title="Insurance cover">
        <ul className="space-y-2 text-sm">
          <li className="flex justify-between gap-3">
            <span>Term cover</span>
            <span className="tabular-nums text-muted-foreground">
              {money(s.cover.termCurrent)}
              {s.cover.termRecommended > 0 ? ` of about ${money(s.cover.termRecommended)}` : ""}
            </span>
          </li>
          <li className="flex justify-between gap-3">
            <span>Health cover</span>
            <span className="tabular-nums text-muted-foreground">
              {money(s.cover.healthCurrent)} of about {money(s.cover.healthRecommended)}
            </span>
          </li>
        </ul>
      </Section>

      {s.goals.length > 0 ? (
        <Section title="Goals">
          <ul className="space-y-3 text-sm">
            {s.goals.map((goal, index) => (
              <li key={`${goal.name}-${index}`} className="flex justify-between gap-3">
                <span className="min-w-0">
                  <span className="block truncate font-medium">{goal.name}</span>
                  <span className="block text-xs text-muted-foreground">{goal.type} · {goal.status}</span>
                </span>
                <span className="shrink-0 tabular-nums text-muted-foreground">
                  {money(goal.currentSaved)} of {money(goal.targetAmount)}
                </span>
              </li>
            ))}
          </ul>
        </Section>
      ) : null}

      {s.nextSteps.length > 0 ? (
        <Section title="Suggested next steps">
          <ol className="list-decimal space-y-3 pl-5 text-sm">
            {s.nextSteps.map((step, index) => (
              <li key={`${step.title}-${index}`}>
                <span className="font-medium">{step.title}</span>
                <span className="block text-muted-foreground">{step.detail}</span>
              </li>
            ))}
          </ol>
        </Section>
      ) : null}

      <p className="text-xs text-muted-foreground">
        General guidance based on the numbers the owner entered. It is not regulated investment or tax advice, and its assumptions have not
        been verified.
      </p>
    </main>
  );
}
