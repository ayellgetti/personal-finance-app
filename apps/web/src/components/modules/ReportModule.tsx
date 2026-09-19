import { useAuth } from "@/lib/auth/store";
import { useFinance } from "@/lib/finance/store";
import { toAccountIdentity } from "@/lib/finance/profile";
import {
  formatCurrency,
  formatPercent,
  monthlyIncome,
  monthlyExpenses,
  monthlyEMI,
  monthlySIP,
  monthlyInsurancePremium,
  monthlySavings,
  monthlyCreditCardDue,
  totalInvestments,
  totalLiabilities,
  totalCreditCardOutstanding,
  creditUtilization,
  netWorth,
  savingsRate,
  debtToIncome,
  healthScore,
  financialFreedom,
  analyzeGoal,
  prepaymentStrategy,
} from "@/lib/finance/calculations";
import { generateReport } from "@/lib/finance/pdfReport";
import { useAdvisorReport } from "@/lib/finance/advisor";
import { AdvisorPlanOfAction, AdvisorSummary } from "./AdvisorOutput";
import { AdvisorPaywallDialog } from "./AdvisorPaywallDialog";
import { Panel, Badge } from "./shared";
import { Button } from "@/components/ui/button";
import { Download, CheckCircle2, AlertTriangle, RefreshCw, Lock } from "lucide-react";
import { toast } from "sonner";

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-border bg-background/40 p-4">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="mt-1 font-display text-lg font-bold">{value}</p>
    </div>
  );
}

function Row({
  name,
  extra,
  value,
}: {
  name: string;
  extra?: string;
  value: string;
}) {
  return (
    <div className="flex items-start justify-between gap-3 border-b border-border/60 py-2 last:border-0">
      <div className="min-w-0">
        <p className="truncate text-sm font-medium">{name}</p>
        {extra ? <p className="text-xs text-muted-foreground">{extra}</p> : null}
      </div>
      <p className="shrink-0 text-sm font-semibold">{value}</p>
    </div>
  );
}

function Empty({ message }: { message: string }) {
  return <p className="text-sm text-muted-foreground">{message}</p>;
}

export function ReportModule() {
  const { user } = useAuth();
  const { data, loading } = useFinance();
  const cur = data.profile.currency;
  const fi = financialFreedom(data);
  const hs = healthScore(data);
  const query = useAdvisorReport(data);
  const goals = data.goals.map((g) => ({ g, a: analyzeGoal(data, g) }));
  const achievable = goals.filter((x) => x.a.status === "On Track");
  const atRisk = goals.filter((x) => x.a.status !== "On Track");
  const recurringExpenses = data.expenses.filter((e) => e.recurring);
  const payoff = prepaymentStrategy(data);

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

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 rounded-3xl bg-gradient-hero p-6 text-primary-foreground shadow-[var(--shadow-elevated)] md:flex-row md:items-center md:justify-between md:p-8">
        <div>
          <h2 className="font-display text-2xl font-bold">Executive Summary Report</h2>
          <p className="text-sm text-primary-foreground/80">
            Your full household picture on one page — position, accounts, goals, and the AI plan.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button
            variant="secondary"
            className="rounded-xl"
            onClick={() => void query.requestRefresh()}
            disabled={query.isRegenerating}
          >
            {query.canRefresh ? (
              <RefreshCw className={`mr-2 h-4 w-4 ${query.isRegenerating ? "animate-spin" : ""}`} />
            ) : (
              <Lock className="mr-2 h-4 w-4" />
            )}
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
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <Stat label="Total Income (monthly)" value={formatCurrency(monthlyIncome(data), cur)} />
          <Stat label="Total Expenses (monthly)" value={formatCurrency(monthlyExpenses(data) + monthlyEMI(data), cur)} />
          <Stat label="Monthly surplus" value={formatCurrency(monthlySavings(data), cur)} />
          <Stat label="Savings Rate" value={formatPercent(savingsRate(data))} />
          <Stat label="Total Investments" value={formatCurrency(totalInvestments(data), cur, true)} />
          <Stat label="Total Loans & cards" value={formatCurrency(totalLiabilities(data), cur, true)} />
          <Stat label="Net Worth" value={formatCurrency(netWorth(data), cur, true)} />
          <Stat label="Freedom Date" value={`${fi.fiDate.getFullYear()} · ${fi.yearsRemaining}y`} />
          <Stat label="Health Score" value={`${hs.total}/100`} />
          <Stat label="Debt-to-Income" value={formatPercent(debtToIncome(data))} />
          <Stat label="Monthly SIPs" value={formatCurrency(monthlySIP(data), cur)} />
          <Stat label="Insurance (monthly)" value={formatCurrency(monthlyInsurancePremium(data), cur)} />
        </div>
      </Panel>

      <div className="grid gap-6 lg:grid-cols-2">
        <Panel title="Income">
          {data.incomes.length ? (
            data.incomes.map((item) => (
              <Row
                key={item.id}
                name={item.name}
                extra={`${item.type} · ${formatPercent(item.growthRate)} growth`}
                value={formatCurrency(item.monthlyAmount, cur)}
              />
            ))
          ) : (
            <Empty message="No income sources added." />
          )}
        </Panel>

        <Panel title="Expenses">
          {recurringExpenses.length ? (
            recurringExpenses.map((item) => (
              <Row
                key={item.id}
                name={item.name}
                extra={item.category}
                value={formatCurrency(item.amount, cur)}
              />
            ))
          ) : (
            <Empty message="No recurring expenses added." />
          )}
        </Panel>

        <Panel title="Loans">
          {data.loans.length ? (
            data.loans.map((item) => (
              <Row
                key={item.id}
                name={item.name}
                extra={`${item.type} · ${formatPercent(item.interestRate)} · EMI ${formatCurrency(item.emi, cur)}`}
                value={formatCurrency(item.outstanding, cur, true)}
              />
            ))
          ) : (
            <Empty message="No loans on file." />
          )}
        </Panel>

        <Panel title="Credit Cards">
          {data.creditCards.length ? (
            <>
              {data.creditCards.map((item) => (
                <Row
                  key={item.id}
                  name={item.name}
                  extra={`${item.network} · min due ${formatCurrency(item.minimumDue, cur)}`}
                  value={formatCurrency(item.outstanding, cur, true)}
                />
              ))}
              <p className="mt-3 text-xs text-muted-foreground">
                Outstanding {formatCurrency(totalCreditCardOutstanding(data), cur, true)} · utilization{" "}
                {formatPercent(creditUtilization(data))} · min dues {formatCurrency(monthlyCreditCardDue(data), cur)}
              </p>
            </>
          ) : (
            <Empty message="No credit cards on file." />
          )}
        </Panel>

        <Panel title="Investments">
          {data.investments.length ? (
            data.investments.map((item) => (
              <Row
                key={item.id}
                name={item.name}
                extra={`${item.type} · SIP ${formatCurrency(item.monthlySip, cur)} · ${formatPercent(item.expectedReturn)}`}
                value={formatCurrency(item.currentValue, cur, true)}
              />
            ))
          ) : (
            <Empty message="No investments added." />
          )}
        </Panel>

        <Panel title="Insurance">
          {data.insurances.length ? (
            data.insurances.map((item) => (
              <Row
                key={item.id}
                name={item.name}
                extra={`${item.type} · premium ${formatCurrency(item.annualPremium, cur)} / yr`}
                value={formatCurrency(item.coverage, cur, true)}
              />
            ))
          ) : (
            <Empty message="No insurance policies added." />
          )}
        </Panel>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Panel title="Achievable Goals">
          <div className="space-y-2">
            {achievable.length ? (
              achievable.map(({ g, a }) => (
                <div key={g.id} className="flex items-center justify-between rounded-xl border border-border bg-background/40 p-3">
                  <span className="flex items-center gap-2 font-medium">
                    <CheckCircle2 className="h-4 w-4 text-success" />
                    {g.name}
                  </span>
                  <Badge tone="success">{a.probability}%</Badge>
                </div>
              ))
            ) : (
              <Empty message="No goals are fully on track yet." />
            )}
          </div>
        </Panel>
        <Panel title="Goals At Risk">
          <div className="space-y-2">
            {atRisk.length ? (
              atRisk.map(({ g, a }) => (
                <div key={g.id} className="flex items-center justify-between rounded-xl border border-border bg-background/40 p-3">
                  <span className="flex items-center gap-2 font-medium">
                    <AlertTriangle className="h-4 w-4 text-accent" />
                    {g.name}
                  </span>
                  <Badge tone="danger">Gap {formatCurrency(a.fundingGap, cur, true)}</Badge>
                </div>
              ))
            ) : (
              <Empty message="All goals are on track 🎉" />
            )}
          </div>
        </Panel>
      </div>

      {query.data && (
        <AdvisorSummary
          advice={query.data.advice}
          currency={cur}
          source={query.data.source}
          generatedAt={query.data.generatedAt}
        />
      )}

      {query.isLoading && (
        <Panel>
          <p className="text-sm text-muted-foreground">Generating summary and plan of action…</p>
        </Panel>
      )}

      {query.data && <AdvisorPlanOfAction advice={query.data.advice} currency={cur} />}

      <Panel title="Debt Payoff Sequence">
        <div className="space-y-2">
          {payoff.length ? (
            payoff.map((l, i) => (
              <div key={l.id} className="flex items-center justify-between rounded-xl border border-border bg-background/40 p-3">
                <span className="font-medium">
                  #{i + 1} · {l.name}
                </span>
                <span className="text-sm text-muted-foreground">
                  {formatPercent(l.interestRate)} · {formatCurrency(l.outstanding, cur, true)}
                </span>
              </div>
            ))
          ) : (
            <Empty message="No active loans to sequence." />
          )}
        </div>
      </Panel>

      <AdvisorPaywallDialog
        open={query.paywallOpen}
        onOpenChange={query.setPaywallOpen}
        quota={query.quota}
      />
    </div>
  );
}
