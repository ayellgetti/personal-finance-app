import { useFinance } from "@/lib/finance/store";
import { generateRecommendations, emergencyFundRecommendations, healthScore } from "@/lib/finance/calculations";
import { Panel, Badge } from "./shared";
import { HealthGauge } from "./HealthGauge";
import { Sparkles, Lightbulb, TrendingUp, Shield, Coins, PiggyBank, Landmark, ShieldAlert } from "lucide-react";

const CAT_ICON: Record<string, typeof Sparkles> = {
  Debt: Landmark,
  Expenses: Coins,
  Savings: PiggyBank,
  Investments: TrendingUp,
  Safety: Shield,
  Insurance: Shield,
  "Emergency Fund": ShieldAlert,
};

export function AIAdvisor() {
  const { data } = useFinance();
  const recs = [...emergencyFundRecommendations(data), ...generateRecommendations(data)];
  const hs = healthScore(data);

  return (
    <div className="space-y-6">
      <div className="relative overflow-hidden rounded-3xl bg-gradient-hero p-6 text-primary-foreground shadow-[var(--shadow-elevated)] md:p-8">
        <div className="absolute -right-8 -top-8 h-40 w-40 rounded-full bg-accent/30 blur-3xl" />
        <div className="relative flex items-center gap-4">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-background/15 backdrop-blur-sm">
            <Sparkles className="h-7 w-7" />
          </div>
          <div>
            <h2 className="font-display text-2xl font-bold">AI Financial Advisor</h2>
            <p className="text-sm text-primary-foreground/80">{recs.length} personalised actions analysed from your complete financial picture.</p>
          </div>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Panel title="Health Snapshot" className="lg:col-span-1">
          <div className="flex flex-col items-center">
            <HealthGauge score={hs} />
            <div className="mt-4 w-full space-y-3">
              {hs.components.map((c) => (
                <div key={c.label}>
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-medium">{c.label}</span>
                    <span className="text-muted-foreground">{c.score}/100</span>
                  </div>
                  <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-muted">
                    <div className="h-full rounded-full bg-gradient-primary" style={{ width: `${c.score}%` }} />
                  </div>
                  <p className="mt-0.5 text-xs text-muted-foreground">{c.detail}</p>
                </div>
              ))}
            </div>
          </div>
        </Panel>

        <div className="space-y-4 lg:col-span-2">
          {recs.map((r, i) => {
            const Icon = CAT_ICON[r.category] ?? Lightbulb;
            return (
              <div key={i} className="flex gap-4 rounded-2xl border border-border bg-card p-5 shadow-[var(--shadow-card)] transition hover:shadow-[var(--shadow-elevated)]">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <Icon className="h-5 w-5" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-display font-semibold">{r.title}</p>
                    <Badge tone={r.impact === "High" ? "danger" : r.impact === "Medium" ? "gold" : "muted"}>{r.impact} impact</Badge>
                    <Badge tone="primary">{r.category}</Badge>
                  </div>
                  <p className="mt-1.5 text-sm text-muted-foreground">{r.detail}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
