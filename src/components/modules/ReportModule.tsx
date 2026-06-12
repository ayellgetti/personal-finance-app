import { useFinance } from "@/lib/finance/store";
import {
  formatCurrency, formatPercent, monthlyIncome, monthlyExpenses, monthlyEMI,
  totalInvestments, totalLiabilities, netWorth, financialFreedom, analyzeGoal,
  generateRecommendations, prepaymentStrategy,
} from "@/lib/finance/calculations";
import { generateReport } from "@/lib/finance/pdfReport";
import { Panel, Badge } from "./shared";
import { Button } from "@/components/ui/button";
import { Download, CheckCircle2, AlertTriangle } from "lucide-react";
import { toast } from "sonner";

export function ReportModule() {
  const { data } = useFinance();
  const cur = data.profile.currency;
  const fi = financialFreedom(data);
  const recs = generateRecommendations(data).slice(0, 5);
  const goals = data.goals.map((g) => ({ g, a: analyzeGoal(data, g) }));
  const achievable = goals.filter((x) => x.a.status === "On Track");
  const atRisk = goals.filter((x) => x.a.status !== "On Track");

  const download = () => {
    try {
      generateReport(data);
      toast.success("Report downloaded as PDF");
    } catch (e) {
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
          <p className="text-sm text-primary-foreground/80">A complete snapshot of your path to financial freedom.</p>
        </div>
        <Button size="lg" variant="secondary" className="rounded-xl" onClick={download}>
          <Download className="mr-2 h-5 w-5" /> Download PDF
        </Button>
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

      <Panel title="Top 5 Actions">
        <div className="space-y-3">
          {recs.map((r, i) => (
            <div key={i} className="flex gap-3 rounded-xl border border-border bg-background/40 p-4">
              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary/10 font-display text-sm font-bold text-primary">{i + 1}</span>
              <div>
                <p className="font-semibold">{r.title}</p>
                <p className="text-sm text-muted-foreground">{r.detail}</p>
              </div>
            </div>
          ))}
        </div>
      </Panel>

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
