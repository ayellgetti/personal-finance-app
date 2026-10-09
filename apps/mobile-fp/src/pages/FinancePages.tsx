import { useEffect, useMemo, useState, type FormEvent } from "react";
import {
  ArrowRight,
  CircleAlert,
  Landmark,
  PiggyBank,
  Plus,
  Receipt,
  RefreshCw,
  ShieldCheck,
  TrendingUp,
  Wallet,
} from "lucide-react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { EmptyState, ErrorState, LoadingState } from "@/components/PageState";
import { SearchBar } from "@/components/SearchBar";
import { SectionCard } from "@/components/SectionCard";
import { FormSheet } from "@/components/forms/FormSheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { formatInr, formatPercent, formatUpdated } from "@/lib/finance/format";
import { useFinance } from "@/lib/finance/store";
import type { FinanceEntity } from "@/lib/finance/remote";

function Metric({ label, value, note }: { label: string; value: string; note?: string }) {
  return (
    <div className="rounded-2xl border border-border bg-card p-3">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="mt-1 break-words font-display text-lg font-bold">{value}</p>
      {note ? <p className="mt-1 text-[11px] text-muted-foreground">{note}</p> : null}
    </div>
  );
}

export function HomePage() {
  const finance = useFinance();
  const report = finance.planner;
  if (finance.loading) return <LoadingState label="Building your financial overview…" />;
  if (finance.error && !report) return <ErrorState message={finance.error} onRetry={() => void finance.refresh()} />;
  if (!report) {
    return (
      <EmptyState label="Add income, expenses, loans, investments, and goals to build your financial overview." />
    );
  }

  const goals = finance.goals.slice(0, 3);
  return (
    <div className="space-y-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm text-muted-foreground">Your financial command centre</p>
          <h2 className="font-display text-2xl font-bold">Know where you stand</h2>
          <p className="mt-1 text-xs text-muted-foreground">Updated {formatUpdated(finance.lastUpdated)}</p>
        </div>
        <Button
          type="button"
          size="icon"
          variant="outline"
          aria-label="Refresh financial overview"
          disabled={finance.refreshing}
          onClick={() => void finance.refresh()}
        >
          <RefreshCw className={finance.refreshing ? "h-4 w-4 animate-spin" : "h-4 w-4"} />
        </Button>
      </div>

      {!report.cashflow.incomeRecorded ? (
        <Link to="/my-plan/income?new=1" className="flex items-start gap-3 rounded-2xl border border-warning/40 bg-warning/10 p-4">
          <CircleAlert className="mt-0.5 h-5 w-5 text-warning" />
          <span>
            <span className="block text-sm font-semibold">Complete your income</span>
            <span className="text-xs text-muted-foreground">Savings and surplus cannot be confirmed until income is recorded.</span>
          </span>
        </Link>
      ) : null}

      <SectionCard eyebrow="Monthly position" title="Money left this month">
        <p className={report.cashflow.surplus < 0 ? "font-display text-3xl font-bold text-danger" : "font-display text-3xl font-bold text-primary"}>
          {formatInr(report.cashflow.surplus)}
        </p>
        <div className="mt-4 grid grid-cols-2 gap-2">
          <Metric label="Income" value={formatInr(report.cashflow.income)} />
          <Metric label="Living costs" value={formatInr(report.cashflow.livingExpenses)} />
          <Metric label="Loan EMIs" value={formatInr(report.cashflow.loanEmis)} />
          <Metric label="Investments" value={formatInr(report.cashflow.investments)} />
        </div>
        <p className="mt-3 text-xs text-muted-foreground">
          Surplus is income minus recorded living costs, loan EMIs, and active investment commitments.
        </p>
      </SectionCard>

      <section>
        <h2 className="mb-2 font-display text-base font-bold">Financial snapshot</h2>
        <div className="grid grid-cols-2 gap-2">
          <Metric label="Net worth*" value={formatInr(report.netWorth.netExcludingProperty)} note="Excludes unrecorded property" />
          <Metric label="Outstanding loans" value={formatInr(report.netWorth.liabilities)} />
          <Metric label="Investments" value={formatInr(report.netWorth.investmentCorpus)} />
          <Metric
            label="Emergency fund"
            value={report.goals.emergencyFund ? formatInr(report.goals.emergencyFund.currentAmount) : "Not recorded"}
          />
        </div>
      </section>

      <SectionCard title="Priority actions" tone="neutral">
        <div className="space-y-3">
          {report.recommendations.slice(0, 3).map((item) => (
            <div key={item.title} className="border-b border-border pb-3 last:border-0 last:pb-0">
              <div className="flex items-center gap-2">
                <span className="rounded-full bg-secondary px-2 py-0.5 text-[10px] font-semibold uppercase">{item.priority}</span>
                <p className="text-sm font-semibold">{item.title}</p>
              </div>
              <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{item.detail}</p>
            </div>
          ))}
        </div>
      </SectionCard>

      <SectionCard
        title="Goals"
        tone="neutral"
        action={<Link to="/goals" className="text-xs font-semibold">View all</Link>}
      >
        {goals.length ? (
          <div className="space-y-3">
            {goals.map((goal) => {
              const progress = goal.targetAmount > 0 ? Math.min(100, (goal.currentAmount / goal.targetAmount) * 100) : 0;
              return (
                <div key={goal.id}>
                  <div className="flex justify-between gap-3 text-sm">
                    <span className="font-medium">{goal.title}</span>
                    <span>{formatPercent(progress)}</span>
                  </div>
                  <div className="mt-1 h-2 overflow-hidden rounded-full bg-secondary">
                    <div className="h-full rounded-full bg-primary" style={{ width: `${progress}%` }} />
                  </div>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {formatInr(goal.currentAmount)} of {formatInr(goal.targetAmount)}
                  </p>
                </div>
              );
            })}
          </div>
        ) : (
          <EmptyState label="No goals recorded yet." />
        )}
      </SectionCard>
    </div>
  );
}

const HUBS = {
  plan: [
    { to: "/my-plan/income", label: "Income", detail: "Salary and other monthly inflows", icon: Wallet },
    { to: "/my-plan/expenses", label: "Expenses", detail: "Essential and discretionary costs", icon: Receipt },
    { to: "/my-plan/loans", label: "Loans", detail: "Outstanding balances and EMIs", icon: Landmark },
    { to: "/my-plan/insurance", label: "Insurance", detail: "Protection policies and premiums", icon: ShieldCheck },
    { to: "/tax", label: "Tax planning", detail: "Compare supported tax regimes", icon: TrendingUp },
  ],
  wealth: [
    { to: "/wealth/investments", label: "Investments", detail: "Assets, SIPs, and recorded values", icon: PiggyBank },
    { to: "/my-plan/loans", label: "Liabilities", detail: "Review debt affecting net worth", icon: Landmark },
    { to: "/report", label: "Net worth report", detail: "Assets minus recorded liabilities", icon: TrendingUp },
  ],
};

function HubPage({ kind }: { kind: keyof typeof HUBS }) {
  const { planner } = useFinance();
  return (
    <div className="space-y-4">
      <div>
        <p className="text-sm text-muted-foreground">{kind === "plan" ? "Manage your financial health" : "Understand what you own and owe"}</p>
        <h2 className="font-display text-2xl font-bold">{kind === "plan" ? "My Plan" : "Wealth"}</h2>
      </div>
      {kind === "wealth" && planner ? (
        <div className="grid grid-cols-2 gap-2">
          <Metric label="Investments" value={formatInr(planner.netWorth.investmentCorpus)} />
          <Metric label="Liabilities" value={formatInr(planner.netWorth.liabilities)} />
          <div className="col-span-2">
            <Metric label="Net worth excluding property" value={formatInr(planner.netWorth.netExcludingProperty)} />
          </div>
        </div>
      ) : null}
      <div className="space-y-2">
        {HUBS[kind].map((item) => {
          const Icon = item.icon;
          return (
            <Link key={item.to} to={item.to} className="flex min-h-16 items-center gap-3 rounded-2xl border border-border bg-card p-4 shadow-sm">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-secondary text-primary">
                <Icon className="h-5 w-5" />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block font-semibold">{item.label}</span>
                <span className="block text-xs text-muted-foreground">{item.detail}</span>
              </span>
              <ArrowRight className="h-4 w-4 text-muted-foreground" />
            </Link>
          );
        })}
      </div>
    </div>
  );
}

export function MyPlanPage() {
  return <HubPage kind="plan" />;
}

export function WealthPage() {
  return <HubPage kind="wealth" />;
}

type Field = {
  key: string;
  label: string;
  type?: "text" | "number" | "date";
  min?: number;
  max?: number;
};

type ResourceConfig = {
  entity: FinanceEntity;
  title: string;
  empty: string;
  fields: Field[];
  defaults: Record<string, string | number | null>;
  filter?: (row: Record<string, unknown>) => boolean;
  normalize?: (values: Record<string, string | number | null>) => Record<string, unknown>;
  titleFor: (row: Record<string, unknown>) => string;
  valueFor: (row: Record<string, unknown>) => string;
  detailFor: (row: Record<string, unknown>) => string;
};

const RESOURCE_CONFIGS: Record<string, ResourceConfig> = {
  income: {
    entity: "budgets",
    title: "Income",
    empty: "Add salary or another source of household income.",
    fields: [
      { key: "title", label: "Income name" },
      { key: "subcategory", label: "Type" },
      { key: "amount", label: "Monthly amount", type: "number", min: 0 },
      { key: "monthDay", label: "Payment day", type: "number", min: 1, max: 31 },
    ],
    defaults: { title: "", subcategory: "salary", amount: 0, monthDay: 1 },
    filter: (row) => row.type === "income",
    normalize: (values) => ({ ...values, type: "income", category: "income", weekDay: null, repeatCount: null }),
    titleFor: (row) => String(row.title ?? "Income"),
    valueFor: (row) => formatInr(Number(row.amount)),
    detailFor: (row) => String(row.subcategory ?? "income").replace(/_/g, " "),
  },
  expenses: {
    entity: "budgets",
    title: "Expenses",
    empty: "Add recurring household costs to understand monthly surplus.",
    fields: [
      { key: "title", label: "Expense name" },
      { key: "subcategory", label: "Category" },
      { key: "amount", label: "Monthly amount", type: "number", min: 0 },
      { key: "monthDay", label: "Payment day", type: "number", min: 1, max: 31 },
    ],
    defaults: { title: "", subcategory: "groceries", amount: 0, monthDay: 1 },
    filter: (row) => row.type === "expense",
    normalize: (values) => ({ ...values, type: "expense", category: "expense", weekDay: null, repeatCount: null }),
    titleFor: (row) => String(row.title ?? "Expense"),
    valueFor: (row) => formatInr(Number(row.amount)),
    detailFor: (row) => String(row.subcategory ?? "expense").replace(/_/g, " "),
  },
  loans: {
    entity: "loans",
    title: "Loans",
    empty: "No active loans are recorded.",
    fields: [
      { key: "title", label: "Loan name" },
      { key: "type", label: "Loan type" },
      { key: "principalPendingAmount", label: "Outstanding principal", type: "number", min: 0 },
      { key: "roi", label: "Interest rate (%)", type: "number", min: 0, max: 100 },
      { key: "emiAmount", label: "Monthly EMI", type: "number", min: 0 },
      { key: "remainingMonths", label: "Months remaining", type: "number", min: 0, max: 600 },
      { key: "emiDay", label: "EMI day", type: "number", min: 1, max: 31 },
    ],
    defaults: { title: "", type: "Personal Loan", principalPendingAmount: 0, roi: 0, emiAmount: 0, remainingMonths: 12, emiDay: 5 },
    titleFor: (row) => String(row.title || row.type || "Loan"),
    valueFor: (row) => formatInr(Number(row.principalPendingAmount)),
    detailFor: (row) => `${formatPercent(Number(row.roi))} · EMI ${formatInr(Number(row.emiAmount))}`,
  },
  investments: {
    entity: "investments",
    title: "Investments",
    empty: "Record an investment to begin your wealth view.",
    fields: [
      { key: "title", label: "Investment name" },
      { key: "subcategory", label: "Type" },
      { key: "accumulatedAmount", label: "Current recorded value", type: "number", min: 0 },
      { key: "investmentAmount", label: "Monthly contribution", type: "number", min: 0 },
      { key: "roi", label: "Expected return (%)", type: "number", min: 0, max: 100 },
      { key: "remainingMonths", label: "Horizon in months", type: "number", min: 0, max: 600 },
      { key: "monthDay", label: "Contribution day", type: "number", min: 1, max: 31 },
    ],
    defaults: { title: "", subcategory: "mf", accumulatedAmount: 0, investmentAmount: 0, roi: 8, remainingMonths: 120, monthDay: 1 },
    normalize: (values) => ({ ...values, category: "investment" }),
    titleFor: (row) => String(row.title || row.subcategory || "Investment"),
    valueFor: (row) => formatInr(Number(row.accumulatedAmount)),
    detailFor: (row) => `Recorded manually · ${formatInr(Number(row.investmentAmount))}/month`,
  },
  insurance: {
    entity: "insurances",
    title: "Insurance",
    empty: "No protection policies are recorded.",
    fields: [
      { key: "title", label: "Policy name" },
      { key: "type", label: "Policy type" },
      { key: "coverageAmount", label: "Coverage amount", type: "number", min: 0 },
      { key: "annualPremium", label: "Annual premium", type: "number", min: 0 },
      { key: "expiryDate", label: "Expiry date", type: "date" },
    ],
    defaults: { title: "", type: "Health Insurance", coverageAmount: 0, annualPremium: 0, expiryDate: new Date().toISOString().slice(0, 10) },
    titleFor: (row) => String(row.title || row.type || "Policy"),
    valueFor: (row) => formatInr(Number(row.coverageAmount)),
    detailFor: (row) => `Premium ${formatInr(Number(row.annualPremium))}/year`,
  },
  goals: {
    entity: "goals",
    title: "Goals",
    empty: "Create a goal to turn an intention into a measurable plan.",
    fields: [
      { key: "title", label: "Goal name" },
      { key: "category", label: "Category" },
      { key: "subcategory", label: "Goal type" },
      { key: "targetAmount", label: "Target amount", type: "number", min: 0 },
      { key: "currentAmount", label: "Already saved", type: "number", min: 0 },
      { key: "remainingYears", label: "Years remaining", type: "number", min: 0, max: 80 },
      { key: "targetYear", label: "Target year", type: "number", min: 1900, max: 2200 },
    ],
    defaults: { title: "", category: "custom", subcategory: "custom", targetAmount: 0, currentAmount: 0, remainingYears: 5, targetYear: new Date().getFullYear() + 5 },
    titleFor: (row) => String(row.title || "Goal"),
    valueFor: (row) => `${formatInr(Number(row.currentAmount))} of ${formatInr(Number(row.targetAmount))}`,
    detailFor: (row) => `Target ${String(row.targetYear ?? "")}`,
  },
};

function recordsFor(entity: FinanceEntity, finance: ReturnType<typeof useFinance>): Record<string, unknown>[] {
  return (finance[entity] as unknown[]).map((item) => item as Record<string, unknown>);
}

export function ResourcePage({ resource }: { resource: keyof typeof RESOURCE_CONFIGS }) {
  const config = RESOURCE_CONFIGS[resource];
  const finance = useFinance();
  const location = useLocation();
  const navigate = useNavigate();
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [values, setValues] = useState<Record<string, string | number | null>>(config.defaults);

  useEffect(() => {
    if (new URLSearchParams(location.search).get("new") === "1") {
      setEditingId(null);
      setValues(config.defaults);
      setOpen(true);
      navigate(location.pathname, { replace: true });
    }
  }, [config.defaults, location.pathname, location.search, navigate]);

  const rows = useMemo(() => {
    const source = recordsFor(config.entity, finance).filter((row) => config.filter?.(row) ?? true);
    const needle = query.trim().toLowerCase();
    return needle ? source.filter((row) => JSON.stringify(row).toLowerCase().includes(needle)) : source;
  }, [config, finance, query]);

  const startEdit = (row: Record<string, unknown>) => {
    const next = { ...config.defaults };
    config.fields.forEach((field) => {
      const value = row[field.key];
      if (typeof value === "string" || typeof value === "number" || value === null) next[field.key] = value;
    });
    setValues(next);
    setEditingId(String(row.id));
    setOpen(true);
  };

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setBusy(true);
    try {
      const input = config.normalize ? config.normalize(values) : values;
      if (editingId) await finance.update(config.entity, editingId, input);
      else await finance.create(config.entity, input);
      toast.success(`${config.title.slice(0, -1)} saved`);
      setOpen(false);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to save");
    } finally {
      setBusy(false);
    }
  };

  if (finance.loading) return <LoadingState label={`Loading ${config.title.toLowerCase()}…`} />;
  return (
    <div className="space-y-4">
      <div className="flex items-end justify-between gap-3">
        <div>
          <p className="text-sm text-muted-foreground">Saved to your financial plan</p>
          <h2 className="font-display text-2xl font-bold">{config.title}</h2>
        </div>
        <Button
          type="button"
          size="icon"
          aria-label={`Add ${config.title.toLowerCase()}`}
          onClick={() => {
            setEditingId(null);
            setValues(config.defaults);
            setOpen(true);
          }}
        >
          <Plus className="h-5 w-5" />
        </Button>
      </div>
      <SearchBar
        value={query}
        onChange={setQuery}
        placeholder={`Search ${config.title.toLowerCase()}`}
        label={`Search ${config.title.toLowerCase()}`}
      />
      {finance.error ? <ErrorState message={finance.error} onRetry={() => void finance.refresh()} /> : null}
      {!finance.error && rows.length === 0 ? <EmptyState label={config.empty} /> : null}
      <div className="space-y-2">
        {rows.map((row) => (
          <button
            key={String(row.id)}
            type="button"
            className="w-full rounded-2xl border border-border bg-card p-4 text-left shadow-sm"
            onClick={() => startEdit(row)}
          >
            <div className="flex items-start justify-between gap-3">
              <span className="font-semibold">{config.titleFor(row)}</span>
              <span className="text-sm font-semibold text-primary">{config.valueFor(row)}</span>
            </div>
            <p className="mt-1 text-xs capitalize text-muted-foreground">{config.detailFor(row)}</p>
          </button>
        ))}
      </div>

      <FormSheet
        open={open}
        onOpenChange={setOpen}
        title={`${editingId ? "Edit" : "Add"} ${config.title.slice(0, -1)}`}
        description="Values are saved securely to your account."
        submitLabel={editingId ? "Save changes" : "Add"}
        busy={busy}
        onSubmit={submit}
      >
        {config.fields.map((field) => (
          <div key={field.key} className="space-y-2">
            <Label htmlFor={field.key}>{field.label}</Label>
            <Input
              id={field.key}
              type={field.type ?? "text"}
              inputMode={field.type === "number" ? "decimal" : undefined}
              min={field.min}
              max={field.max}
              step={field.type === "number" ? "any" : undefined}
              value={String(values[field.key] ?? "")}
              onChange={(event) =>
                setValues((current) => ({
                  ...current,
                  [field.key]: field.type === "number" ? Number(event.target.value) : event.target.value,
                }))
              }
              required
            />
          </div>
        ))}
        {editingId ? (
          <Button
            type="button"
            variant="destructive"
            className="w-full"
            disabled={busy}
            onClick={async () => {
              if (!window.confirm("Remove this record?")) return;
              setBusy(true);
              try {
                await finance.remove(config.entity, editingId);
                toast.success("Record removed");
                setOpen(false);
              } catch (error) {
                toast.error(error instanceof Error ? error.message : "Unable to remove");
              } finally {
                setBusy(false);
              }
            }}
          >
            Remove
          </Button>
        ) : null}
      </FormSheet>
    </div>
  );
}

export function GoalsPage() {
  return <ResourcePage resource="goals" />;
}
