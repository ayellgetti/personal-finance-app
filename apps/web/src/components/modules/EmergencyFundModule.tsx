import { useFinance } from "@/lib/finance/store";
import {
  formatCurrency,
  emergencyFund,
  emergencyFundAlerts,
  emergencyFundRecommendations,
  essentialMonthlyExpenses,
  EF_RULE_LABEL,
} from "@/lib/finance/calculations";
import { EmploymentType } from "@/types/finance";
import { EntityDialog, FieldDef } from "@/components/EntityDialog";
import { StatCard } from "@/components/StatCard";
import { Panel, Badge } from "./shared";
import { Progress } from "@/components/ui/progress";
import {
  ShieldAlert, ShieldCheck, Target, CalendarClock, Wallet, Landmark,
  PiggyBank, TrendingUp, AlertTriangle, Info, Sparkles, Settings2,
} from "lucide-react";

const EMPLOYMENT_TYPES: EmploymentType[] = ["Salaried", "Business Owner", "Freelancer", "Retired"];

const FUND_SOURCES = [
  { name: "Savings Account", desc: "Instant access, zero risk", icon: Wallet, share: "20–30%" },
  { name: "Fixed Deposit", desc: "Sweep-in FD for higher interest", icon: Landmark, share: "30–40%" },
  { name: "Liquid Mutual Funds", desc: "1-day redemption, better returns", icon: TrendingUp, share: "20–30%" },
  { name: "Money Market Funds", desc: "Stable, low-volatility parking", icon: PiggyBank, share: "10–20%" },
];

const STATUS_TONE: Record<string, { tone: "danger" | "gold" | "success"; label: string; text: string }> = {
  Red: { tone: "danger", label: "Critical", text: "text-danger" },
  Yellow: { tone: "gold", label: "Building", text: "text-accent" },
  Green: { tone: "success", label: "Secure", text: "text-success" },
};

export function EmergencyFundModule() {
  const { data, updateProfile } = useFinance();
  const cur = data.profile.currency;
  const ef = emergencyFund(data);
  const alerts = emergencyFundAlerts(data);
  const recs = emergencyFundRecommendations(data);
  const status = STATUS_TONE[ef.status];

  const fields: FieldDef[] = [
    { name: "employmentType", label: "Employment Type", type: "select", options: EMPLOYMENT_TYPES, defaultValue: data.profile.employmentType, span: 2 },
    { name: "monthlyEssentialExpenses", label: "Monthly Essential Expenses (0 = auto)", type: "number", prefix: cur, defaultValue: data.profile.monthlyEssentialExpenses, span: 2 },
    { name: "emergencyFund", label: "Current Emergency Fund Balance", type: "number", prefix: cur, defaultValue: data.profile.emergencyFund },
    { name: "liquidAssets", label: "Existing Liquid Assets", type: "number", prefix: cur, defaultValue: data.profile.liquidAssets },
    { name: "emergencyMonthlyContribution", label: "Monthly Contribution", type: "number", prefix: cur, defaultValue: data.profile.emergencyMonthlyContribution },
    { name: "dependents", label: "Number of Dependents", type: "number", defaultValue: data.profile.dependents },
  ];

  return (
    <div className="space-y-6">
      {/* Hero */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-hero p-6 text-primary-foreground shadow-[var(--shadow-elevated)] md:p-8">
        <div className="absolute -right-10 -top-10 h-48 w-48 rounded-full bg-primary/30 blur-3xl" />
        <div className="relative flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
          <div>
            <div className="flex items-center gap-2 text-sm uppercase tracking-wider text-primary-foreground/70">
              {ef.status === "Green" ? <ShieldCheck className="h-4 w-4" /> : <ShieldAlert className="h-4 w-4" />}
              Emergency Fund · {data.profile.employmentType}
            </div>
            <p className="mt-1 font-display text-4xl font-bold md:text-5xl">{ef.coverageMonths.toFixed(1)} months</p>
            <p className="mt-2 text-sm text-primary-foreground/80">
              {formatCurrency(ef.totalAvailable, cur, true)} available of {formatCurrency(ef.recommendedTarget, cur, true)} target · Rule: {EF_RULE_LABEL[ef.employmentType]}
            </p>
          </div>
          <div className="rounded-2xl bg-background/10 p-4 backdrop-blur-sm">
            <p className="text-xs text-primary-foreground/70">Safety Score</p>
            <p className="font-display text-3xl font-bold">{ef.safetyScore}/100</p>
            <span className="mt-1 inline-block rounded-full bg-background/20 px-2.5 py-0.5 text-xs font-semibold">
              Status: {status.label}
            </span>
          </div>
        </div>
        <div className="relative mt-6">
          <div className="mb-1 flex justify-between text-xs text-primary-foreground/80">
            <span>Target Completion Tracker</span>
            <span>{ef.progress.toFixed(0)}%</span>
          </div>
          <div className="h-3 w-full overflow-hidden rounded-full bg-background/20">
            <div className="h-full rounded-full bg-primary-foreground/90 transition-all" style={{ width: `${ef.progress}%` }} />
          </div>
        </div>
      </div>

      {/* Alerts */}
      {alerts.length > 0 && (
        <div className="space-y-2">
          {alerts.map((a, i) => {
            const Icon = a.level === "danger" ? AlertTriangle : a.level === "warning" ? ShieldAlert : Info;
            const cls = a.level === "danger"
              ? "border-danger/30 bg-danger/10 text-danger"
              : a.level === "warning"
              ? "border-accent/30 bg-accent/10 text-accent"
              : "border-primary/30 bg-primary/10 text-primary";
            return (
              <div key={i} className={`flex items-start gap-3 rounded-xl border p-3 text-sm font-medium ${cls}`}>
                <Icon className="mt-0.5 h-4 w-4 shrink-0" />
                <span>{a.message}</span>
              </div>
            );
          })}
        </div>
      )}

      {/* Stats */}
      <div className="flex items-center justify-between">
        <h3 className="font-display text-lg font-semibold">Your Emergency Fund</h3>
        <EntityDialog
          title="Edit Emergency Fund Inputs"
          description="Update your essentials, balances and contribution plan."
          fields={fields}
          trigger={
            <button className="inline-flex items-center gap-2 rounded-xl border border-border px-3 py-2 text-sm font-medium transition hover:bg-muted">
              <Settings2 className="h-4 w-4" /> Edit Inputs
            </button>
          }
          onSubmit={(v) => updateProfile(v)}
        />
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
        <StatCard label="Recommended Target" value={formatCurrency(ef.recommendedTarget, cur, true)} sub={`${ef.targetMonths} mo`} icon={Target} accent="primary" />
        <StatCard label="Current Coverage" value={`${ef.coverageMonths.toFixed(1)} mo`} sub={status.label} trend={ef.status === "Green" ? "up" : "down"} icon={ShieldCheck} accent={ef.status === "Green" ? "primary" : "danger"} />
        <StatCard label="Shortfall" value={formatCurrency(ef.shortfall, cur, true)} icon={ShieldAlert} accent="danger" />
        <StatCard label="Monthly Contribution" value={formatCurrency(ef.monthlyContribution, cur)} icon={PiggyBank} accent="gold" />
        <StatCard label="Est. Completion" value={ef.completionDate ? ef.completionDate.toLocaleDateString("en-IN", { month: "short", year: "numeric" }) : "Funded ✓"} sub={ef.monthsToComplete ? `${ef.monthsToComplete} mo` : undefined} icon={CalendarClock} accent="default" />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Progress + breakdown */}
        <Panel className="lg:col-span-2" title="Fund Progress & Breakdown">
          <div className="space-y-5">
            <div>
              <div className="mb-2 flex items-center justify-between text-sm">
                <span className="text-muted-foreground">{formatCurrency(ef.totalAvailable, cur, true)} of {formatCurrency(ef.recommendedTarget, cur, true)}</span>
                <Badge tone={status.tone}>{ef.status} · {status.label}</Badge>
              </div>
              <Progress value={ef.progress} className="h-3" />
              <div className="mt-1 flex justify-between text-xs text-muted-foreground">
                <span>0</span><span>3 mo</span><span>{ef.targetMonths} mo (target)</span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              {[
                { label: "Monthly Essentials", value: formatCurrency(ef.monthlyEssential, cur) },
                { label: "Cash Balance", value: formatCurrency(ef.currentBalance, cur, true) },
                { label: "Liquid Assets", value: formatCurrency(ef.liquidAssets, cur, true) },
                { label: "Inflation-Adj Target", value: formatCurrency(ef.inflationAdjustedTarget, cur, true) },
                { label: "Months to Goal", value: ef.monthsToComplete ? `${ef.monthsToComplete}` : "0" },
                { label: "Auto Essentials", value: formatCurrency(essentialMonthlyExpenses(data), cur) },
              ].map((s) => (
                <div key={s.label} className="rounded-xl bg-muted/50 p-3">
                  <p className="text-xs text-muted-foreground">{s.label}</p>
                  <p className="mt-0.5 font-display font-bold">{s.value}</p>
                </div>
              ))}
            </div>

            <div className="rounded-xl border border-border p-3 text-xs text-muted-foreground">
              <span className="font-semibold text-foreground">Status bands:</span>{" "}
              <span className="text-danger">Red &lt; 3 months</span> ·{" "}
              <span className="text-accent">Yellow 3–{ef.targetMonths} months</span> ·{" "}
              <span className="text-success">Green ≥ {ef.targetMonths} months (target)</span>
            </div>
          </div>
        </Panel>

        {/* Safety score gauge */}
        <Panel title="Safety Score">
          <div className="flex flex-col items-center justify-center py-2">
            <div className={`flex h-32 w-32 flex-col items-center justify-center rounded-full border-8 ${ef.status === "Green" ? "border-success" : ef.status === "Yellow" ? "border-accent" : "border-danger"}`}>
              <span className={`font-display text-4xl font-bold ${status.text}`}>{ef.safetyScore}</span>
              <span className="text-xs text-muted-foreground">/ 100</span>
            </div>
            <p className="mt-4 text-center text-sm text-muted-foreground">
              {ef.coverageMonths.toFixed(1)} months of essential expenses are protected.
            </p>
            <span className="mt-3 rounded-full bg-muted px-3 py-1 text-xs font-semibold">
              Contributes 25% to health score
            </span>
          </div>
        </Panel>
      </div>

      {/* Fund sources + AI recs */}
      <div className="grid gap-6 lg:grid-cols-2">
        <Panel title="Recommended Fund Sources">
          <div className="space-y-3">
            {FUND_SOURCES.map((s) => {
              const Icon = s.icon;
              return (
                <div key={s.name} className="flex items-center gap-3 rounded-xl border border-border bg-background/40 p-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                    <Icon className="h-5 w-5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold">{s.name}</p>
                    <p className="text-xs text-muted-foreground">{s.desc}</p>
                  </div>
                  <Badge tone="primary">{s.share}</Badge>
                </div>
              );
            })}
          </div>
        </Panel>

        <Panel title="AI Recommendations" action={<Sparkles className="h-4 w-4 text-accent" />}>
          <div className="space-y-3">
            {recs.map((r, i) => (
              <div key={i} className="rounded-xl border border-border bg-background/40 p-3">
                <div className="flex items-center justify-between gap-2">
                  <p className="font-semibold">{r.title}</p>
                  <Badge tone={r.impact === "High" ? "danger" : r.impact === "Medium" ? "gold" : "success"}>{r.impact}</Badge>
                </div>
                <p className="mt-1 text-sm text-muted-foreground">{r.detail}</p>
              </div>
            ))}
          </div>
        </Panel>
      </div>
    </div>
  );
}
