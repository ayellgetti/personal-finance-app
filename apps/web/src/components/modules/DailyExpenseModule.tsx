import { useFinance, newId } from "@/lib/finance/store";
import {
  formatCurrency, dailySummary, dailyByCategory, dailyTrend,
} from "@/lib/finance/calculations";
import { DailyCategory } from "@/types/finance";
import { EntityDialog, FieldDef } from "@/components/EntityDialog";
import { StatCard } from "@/components/StatCard";
import { Panel, ItemRow, EmptyState, Badge, CHART_COLORS, tooltipStyle } from "./shared";
import {
  Utensils, Fuel, ShoppingBag, Bus, ReceiptText, Clapperboard, Stethoscope, MoreHorizontal,
  CalendarDays, CalendarRange, Wallet, PiggyBank,
} from "lucide-react";
import {
  AreaChart, Area, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid,
  ResponsiveContainer, Tooltip, Legend,
} from "recharts";

const CATEGORIES: DailyCategory[] = ["Food", "Fuel", "Shopping", "Transport", "Bills", "Entertainment", "Medical", "Other"];

const CAT_ICON: Record<DailyCategory, typeof Utensils> = {
  Food: Utensils,
  Fuel: Fuel,
  Shopping: ShoppingBag,
  Transport: Bus,
  Bills: ReceiptText,
  Entertainment: Clapperboard,
  Medical: Stethoscope,
  Other: MoreHorizontal,
};

export function DailyExpenseModule() {
  const { data, addItem, removeItem, updateProfile } = useFinance();
  const cur = data.profile.currency;
  const summary = dailySummary(data);
  const byCat = dailyByCategory(data, 30);
  const trend = dailyTrend(data, 14);

  const recent = [...data.dailyExpenses].sort((a, b) => +new Date(b.date) - +new Date(a.date)).slice(0, 40);

  const fields: FieldDef[] = [
    { name: "amount", label: "Amount", type: "number", prefix: cur, span: 2 },
    { name: "category", label: "Category", type: "select", options: CATEGORIES, span: 2 },
    { name: "notes", label: "Notes (optional)", type: "text", span: 2 },
  ];

  const budgetFields: FieldDef[] = [
    { name: "dailyBudget", label: "Monthly Spending Budget", type: "number", prefix: cur, defaultValue: data.profile.dailyBudget, span: 2 },
  ];

  const overBudget = summary.remaining < 0;

  return (
    <div className="space-y-6">
      {/* Quick add */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h3 className="font-display text-lg font-semibold">Quick Expense Entry</h3>
        <div className="flex gap-2">
          <EntityDialog
            title="Set Monthly Budget"
            fields={budgetFields}
            trigger={
              <button className="inline-flex items-center gap-2 rounded-xl border border-border px-3 py-2 text-sm font-medium transition hover:bg-muted">
                <PiggyBank className="h-4 w-4" /> Budget
              </button>
            }
            onSubmit={(v) => updateProfile(v)}
          />
          <EntityDialog
            title="Log Expense"
            fields={fields}
            triggerLabel="Log Expense"
            onSubmit={(v) => addItem("dailyExpenses", { id: newId(), date: new Date().toISOString(), ...v } as any)}
          />
        </div>
      </div>

      {/* One-tap category buttons */}
      <div className="grid grid-cols-4 gap-3 sm:grid-cols-8">
        {CATEGORIES.map((c) => {
          const Icon = CAT_ICON[c];
          return (
            <EntityDialog
              key={c}
              title={`Log ${c} Expense`}
              fields={[
                { name: "amount", label: "Amount", type: "number", prefix: cur, span: 2 },
                { name: "category", label: "Category", type: "select", options: CATEGORIES, defaultValue: c, span: 2 },
                { name: "notes", label: "Notes (optional)", type: "text", span: 2 },
              ]}
              trigger={
                <button className="flex flex-col items-center gap-2 rounded-2xl border border-border bg-card p-3 text-center transition hover:border-primary/50 hover:shadow-[var(--shadow-card)]">
                  <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                    <Icon className="h-5 w-5" />
                  </span>
                  <span className="text-xs font-medium">{c}</span>
                </button>
              }
              onSubmit={(v) => addItem("dailyExpenses", { id: newId(), date: new Date().toISOString(), ...v } as any)}
            />
          );
        })}
      </div>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Today's Spending" value={formatCurrency(summary.today, cur)} icon={CalendarDays} accent="primary" />
        <StatCard label="This Week" value={formatCurrency(summary.week, cur)} icon={CalendarRange} accent="gold" />
        <StatCard label="This Month" value={formatCurrency(summary.month, cur)} sub={`avg ${formatCurrency(summary.avgPerDay, cur)}/day`} icon={Wallet} accent="default" />
        <StatCard
          label="Remaining Budget"
          value={formatCurrency(Math.abs(summary.remaining), cur)}
          sub={overBudget ? "Over budget" : `${(100 - summary.budgetUsedPct).toFixed(0)}% left`}
          trend={overBudget ? "down" : "up"}
          icon={PiggyBank}
          accent={overBudget ? "danger" : "primary"}
        />
      </div>

      {/* Budget tracking bar */}
      <Panel title="Budget vs Actual (This Month)">
        <div className="mb-2 flex items-center justify-between text-sm">
          <span className="text-muted-foreground">{formatCurrency(summary.month, cur)} spent of {formatCurrency(summary.budget, cur)}</span>
          <Badge tone={overBudget ? "danger" : summary.budgetUsedPct > 80 ? "gold" : "success"}>
            {summary.budgetUsedPct.toFixed(0)}% used
          </Badge>
        </div>
        <div className="h-3 w-full overflow-hidden rounded-full bg-muted">
          <div
            className={`h-full rounded-full transition-all ${overBudget ? "bg-danger" : summary.budgetUsedPct > 80 ? "bg-accent" : "bg-primary"}`}
            style={{ width: `${summary.budgetUsedPct}%` }}
          />
        </div>
      </Panel>

      {/* Trend + category */}
      <div className="grid gap-6 lg:grid-cols-3">
        <Panel className="lg:col-span-2" title="Daily Spending Trend (14 days)">
          <ResponsiveContainer width="100%" height={280}>
            <AreaChart data={trend}>
              <defs>
                <linearGradient id="dailyGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity={0.5} />
                  <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
              <XAxis dataKey="day" tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} />
              <YAxis tickFormatter={(v) => formatCurrency(v, cur, true)} tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} width={55} />
              <Tooltip contentStyle={tooltipStyle} formatter={(v: number) => formatCurrency(v, cur)} />
              <Area type="monotone" dataKey="amount" stroke="hsl(var(--primary))" strokeWidth={2.5} fill="url(#dailyGrad)" name="Spent" />
            </AreaChart>
          </ResponsiveContainer>
        </Panel>

        <Panel title="Category Analysis (30 days)">
          {byCat.length ? (
            <ResponsiveContainer width="100%" height={280}>
              <PieChart>
                <Pie data={byCat} dataKey="value" nameKey="name" innerRadius={45} outerRadius={85} paddingAngle={3}>
                  {byCat.map((_, i) => <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />)}
                </Pie>
                <Tooltip contentStyle={tooltipStyle} formatter={(v: number) => formatCurrency(v, cur)} />
                <Legend wrapperStyle={{ fontSize: "0.65rem" }} />
              </PieChart>
            </ResponsiveContainer>
          ) : <EmptyState message="No expenses logged yet" />}
        </Panel>
      </div>

      {/* Recent log */}
      <Panel title="Recent Expenses">
        <div className="max-h-[420px] space-y-3 overflow-y-auto pr-1">
          {recent.length ? recent.map((e) => (
            <ItemRow
              key={e.id}
              title={e.notes || e.category}
              subtitle={`${e.category} · ${new Date(e.date).toLocaleString("en-IN", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}`}
              values={[{ label: "Amount", value: formatCurrency(e.amount, cur), emphasis: true }]}
              onDelete={() => removeItem("dailyExpenses", e.id)}
            />
          )) : <EmptyState message="Log your first daily expense" />}
        </div>
      </Panel>
    </div>
  );
}
