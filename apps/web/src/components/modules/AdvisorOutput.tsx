import { AdvisorReport, AdvisorSource } from "@/lib/finance/advisor";
import { formatCurrency } from "@/lib/finance/calculations";
import { Panel, Badge } from "./shared";
import {
  AlertTriangle, CheckCircle2, Landmark, Lightbulb, ListChecks, PiggyBank,
  Shield, ShieldAlert, Sparkles, TrendingUp, Coins,
} from "lucide-react";

const CAT_ICON: Record<string, typeof Sparkles> = {
  Debt: Landmark,
  Expenses: Coins,
  Savings: PiggyBank,
  Investments: TrendingUp,
  Safety: Shield,
  Insurance: Shield,
  "Emergency Fund": ShieldAlert,
  Goals: CheckCircle2,
};

const WARN_TONE: Record<string, "danger" | "gold" | "muted"> = {
  high: "danger",
  medium: "gold",
  low: "muted",
};

const SOURCE_LABEL: Record<AdvisorSource, string> = {
  openai: "OpenAI",
  cache: "Saved",
  rules: "Rule engine",
};

export function AdvisorSummary({
  advice,
  source,
  generatedAt,
}: {
  advice: AdvisorReport;
  currency?: string;
  source: AdvisorSource;
  generatedAt?: string;
}) {
  return (
    <div className="space-y-6">
      <Panel
        title="AI Summary Report"
        action={<Badge tone={source === "rules" ? "muted" : "primary"}>{SOURCE_LABEL[source]}</Badge>}
      >
        <p className="font-display text-lg font-semibold">{advice.summaryReport.headline}</p>
        <p className="mt-2 text-sm text-muted-foreground">{advice.executiveSummary}</p>
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          {advice.summaryReport.highlights.map((item) => (
            <div key={item.label} className="rounded-xl border border-border bg-background/40 p-3">
              <p className="text-xs text-muted-foreground">{item.label}</p>
              <p className="mt-1 text-sm font-medium">{item.detail}</p>
            </div>
          ))}
        </div>
        {generatedAt && (
          <p className="mt-3 text-xs text-muted-foreground">
            Saved {new Date(generatedAt).toLocaleString()}
          </p>
        )}
      </Panel>

      {advice.riskWarnings.length > 0 && (
        <Panel title="Risks to watch">
          <div className="space-y-2">
            {advice.riskWarnings.map((warning) => (
              <div key={warning.title} className="flex items-start gap-3 rounded-xl border border-border bg-background/40 p-3">
                <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-accent" />
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-medium">{warning.title}</p>
                    <Badge tone={WARN_TONE[warning.severity]}>{warning.severity}</Badge>
                  </div>
                  <p className="mt-1 text-sm text-muted-foreground">{warning.detail}</p>
                </div>
              </div>
            ))}
          </div>
        </Panel>
      )}

      <p className="text-xs text-muted-foreground">{advice.disclaimer}</p>
    </div>
  );
}

export function AdvisorPlanOfAction({
  advice,
  currency,
}: {
  advice: AdvisorReport;
  currency: string;
}) {
  return (
    <div className="space-y-6">
      <Panel title="Plan of action" action={<ListChecks className="h-4 w-4 text-primary" />}>
        <div className="space-y-4">
          {advice.planOfAction.map((step) => {
            const Icon = CAT_ICON[step.category] ?? Lightbulb;
            return (
              <div key={`${step.priority}-${step.action}`} className="flex gap-4 rounded-2xl border border-border bg-card p-5 shadow-[var(--shadow-card)]">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary/10 font-display font-bold text-primary">
                  {step.priority}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-display font-semibold">{step.action}</p>
                    <Badge tone={step.impact === "High" ? "danger" : step.impact === "Medium" ? "gold" : "muted"}>{step.impact}</Badge>
                    <Badge tone="primary">{step.category}</Badge>
                  </div>
                  <p className="mt-1.5 text-sm text-muted-foreground">{step.rationale}</p>
                  {step.monthlyAmount != null && step.monthlyAmount > 0 && (
                    <p className="mt-2 text-sm font-medium">{formatCurrency(step.monthlyAmount, currency)} / month</p>
                  )}
                </div>
                <Icon className="hidden h-5 w-5 shrink-0 text-muted-foreground sm:block" />
              </div>
            );
          })}
        </div>
      </Panel>

      <div className="grid gap-6 lg:grid-cols-2">
        <Panel title="Debt strategy">
          <p className="text-sm text-muted-foreground">{advice.debtStrategy.summary}</p>
          <div className="mt-3 space-y-2">
            {advice.debtStrategy.steps.map((step) => (
              <div key={step.order} className="rounded-xl border border-border bg-background/40 p-3">
                <p className="font-medium">#{step.order} · {step.loan}</p>
                <p className="text-sm text-muted-foreground">{step.action} — {step.reason}</p>
              </div>
            ))}
          </div>
        </Panel>
        <Panel title="Investment strategy">
          <Badge tone="primary">{advice.investmentStrategy.status}</Badge>
          <p className="mt-3 text-sm text-muted-foreground">{advice.investmentStrategy.rationale}</p>
          <p className="mt-2 text-sm">{advice.investmentStrategy.resumeTrigger}</p>
        </Panel>
      </div>
    </div>
  );
}
