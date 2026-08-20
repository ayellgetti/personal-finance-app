import { useAuth } from "@/lib/auth/store";
import { useFinance } from "@/lib/finance/store";
import { toAccountIdentity } from "@/lib/finance/profile";
import {
  formatCurrency, formatPercent, monthlyIncome, monthlyExpenses, monthlyEMI,
  totalInvestments, totalLiabilities, netWorth, financialFreedom, analyzeGoal,
  prepaymentStrategy,
} from "@/lib/finance/calculations";
import { generateReport } from "@/lib/finance/pdfReport";
import { useAdvisorReport } from "@/lib/finance/advisor";
import { AdvisorPlanOfAction, AdvisorSummary } from "./AdvisorOutput";
import { Panel, Badge } from "./shared";
import { Button } from "@/components/ui/button";
import { Download, CheckCircle2, AlertTriangle, RefreshCw } from "lucide-react";
import { toast } from "sonner";

export function ReportModule() {
  const { user } = useAuth();
  const { data, loading } = useFinance();
  const cur = data.profile.currency;
  const fi = financialFreedom(data);
  const query = useAdvisorReport(data);
  const goals = data.goals.map((g) => ({ g, a: analyzeGoal(data, g) }));
  const achievable = goals.filter((x) => x.a.status === "On Track");
  const atRisk = goals.filter((x) => x.a.status !== "On Track");

  const download = () => {
    if (loading) {
      toast.error("Wait for your saved data to load, then download");
      return;
    }
    if (!query.data) {
      toast.error("Wait for the summary report to load, then download");
      return;
    }
    try {
      generateReport(data, query.data, user ? toAccountIdentity(user) : null);
      toast.success("Summary report downloaded as PDF");
    } catch {
      toast.error("Could not generate report");
    }
  };

  const Stat = ({ label, value }: { label: string; value: string }) => (
    <div className="rounded-xl border border-border bg-background/40 p-4">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="mt-1 font-display text-lg font-bold">{value}</p>
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 rounded-3xl bg-gradient-hero p-6 text-primary-foreground shadow-[var(--shadow-elevated)] md:flex-row md:items-center md:justify-between md:p-8">
        <div>
          <h2 className="font-display text-2xl font-bold">Executive Summary Report</h2>
          <p className="text-sm text-primary-foreground/80">Snapshot of your position, plus an AI summary and plan of action.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button
            variant="secondary"
            className="rounded-xl"
            onClick={() => void query.regenerate()}
            disabled={query.isRegenerating}
          >
            <RefreshCw className={`mr-2 h-4 w-4 ${query.isRegenerating ? "animate-spin" : ""}`} />
            Refresh AI
          </Button>
          <Button
            type="button"
            size="lg"
            variant="secondary"
            className="rounded-xl"
            onClick={download}
            disabled={loading || !query.data || query.isLoading}
          >
            <Download className="mr-2 h-5 w-5" /> Download PDF
          </Button>
        </div>
      </div>

      <Panel title="Current Position">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <Stat label="Total Income (monthly)" value={formatCurrency(monthlyIncome(data), cur)} />
          <Stat label="Total Expenses (monthly)" value={formatCurrency(monthlyExpenses(data) + monthlyEMI(data), cur)} />
          <Stat label="Total Investments" value={formatCurrency(totalInvestments(data), cur, true)} />
          <Stat label="Total Loans" value={formatCurrency(totalLiabilities(data), cur, true)} />
          <Stat label="Net Worth" value={formatCurrency(netWorth(data), cur, true)} />
          <Stat label="Freedom Date" value={`${fi.fiDate.getFullYear()} · ${fi.yearsRemaining}y`} />
        </div>
      </Panel>

      {query.data && (
        <AdvisorSummary
          advice={query.data.advice}
          currency={cur}
          source={query.data.source}
          generatedAt={query.data.generatedAt}
        />
      )}

      <div className="grid gap-6 lg:grid-cols-2">
        <Panel title="Achievable Goals">
          <div className="space-y-2">
            {achievable.length ? achievable.map(({ g, a }) => (
              <div key={g.id} className="flex items-center justify-between rounded-xl border border-border bg-background/40 p-3">
                <span className="flex items-center gap-2 font-medium"><CheckCircle2 className="h-4 w-4 text-success" />{g.name}</span>
                <Badge tone="success">{a.probability}%</Badge>
              </div>
            )) : <p className="text-sm text-muted-foreground">No goals are fully on track yet.</p>}
          </div>
        </Panel>
        <Panel title="Goals At Risk">
          <div className="space-y-2">
            {atRisk.length ? atRisk.map(({ g, a }) => (
              <div key={g.id} className="flex items-center justify-between rounded-xl border border-border bg-background/40 p-3">
                <span className="flex items-center gap-2 font-medium"><AlertTriangle className="h-4 w-4 text-accent" />{g.name}</span>
                <div className="text-right text-sm">
                  <Badge tone="danger">Gap {formatCurrency(a.fundingGap, cur, true)}</Badge>
                </div>
              </div>
            )) : <p className="text-sm text-muted-foreground">All goals are on track 🎉</p>}
          </div>
        </Panel>
      </div>

      {query.isLoading && (
        <Panel>
          <p className="text-sm text-muted-foreground">Generating summary and plan of action…</p>
        </Panel>
      )}

      {query.data && <AdvisorPlanOfAction advice={query.data.advice} currency={cur} />}

      <Panel title="Debt Payoff Sequence">
        <div className="space-y-2">
          {prepaymentStrategy(data).map((l, i) => (
            <div key={l.id} className="flex items-center justify-between rounded-xl border border-border bg-background/40 p-3">
              <span className="font-medium">#{i + 1} · {l.name}</span>
              <span className="text-sm text-muted-foreground">{formatPercent(l.interestRate)} · {formatCurrency(l.outstanding, cur, true)}</span>
            </div>
          ))}
        </div>
      </Panel>
    </div>
  );
}
