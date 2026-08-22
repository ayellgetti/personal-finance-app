import { useFinance, newId } from "@/lib/finance/store";
import { formatCurrency, monthlyExpenses, oneTimeExpenses } from "@/lib/finance/calculations";
import { Expense, ExpenseCategory } from "@/types/finance";
import { EntityDialog, FieldDef } from "@/components/EntityDialog";
import { Panel, ItemRow, EmptyState, Badge, EditButton, CHART_COLORS, tooltipStyle } from "./shared";
import { StatCard } from "@/components/StatCard";
import { Receipt, RefreshCw, Coins } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip, Cell } from "recharts";

const CATEGORIES: ExpenseCategory[] = [
  "House Rent / EMI", "Electricity Bill", "Water Bill", "Internet", "Mobile", "Groceries", "Fuel",
  "Transportation", "LIC Premium", "School Fees", "Entertainment", "Dining Out", "Travel", "Medical", "Other",
];

function expenseFields(expense: Expense | undefined, currency: string): FieldDef[] {
  return [
    { name: "name", label: "Expense Name", type: "text", span: 2, defaultValue: expense?.name ?? "" },
    { name: "category", label: "Category", type: "select", options: CATEGORIES, span: 2, defaultValue: expense?.category ?? CATEGORIES[0] },
    { name: "amount", label: "Amount", type: "number", prefix: currency, defaultValue: expense?.amount ?? 0 },
    { name: "date", label: "Date", type: "date", defaultValue: expense?.date ?? new Date().toISOString().slice(0, 10) },
    { name: "recurring", label: "Monthly Recurring (off = one-time)", type: "switch", defaultValue: expense?.recurring ?? true },
  ];
}

export function ExpenseModule() {
  const { data, addItem, updateItem, removeItem } = useFinance();
  const cur = data.profile.currency;
  const recurring = monthlyExpenses(data);
  const oneTime = oneTimeExpenses(data);

  const byCat = CATEGORIES.map((c) => ({
    name: c,
    value: data.expenses.filter((e) => e.category === c && e.recurring).reduce((s, e) => s + e.amount, 0),
  })).filter((x) => x.value > 0).sort((a, b) => b.value - a.value);

  const fields = expenseFields(undefined, cur);

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard label="Monthly Recurring" value={formatCurrency(recurring, cur)} icon={RefreshCw} accent="primary" />
        <StatCard label="One-time (logged)" value={formatCurrency(oneTime, cur)} icon={Coins} accent="gold" />
        <StatCard label="Annual Run-rate" value={formatCurrency(recurring * 12, cur, true)} icon={Receipt} accent="danger" />
      </div>

      <div className="grid gap-6 lg:grid-cols-5">
        <Panel className="lg:col-span-2" title="Expense Breakdown">
          {byCat.length ? (
            <ResponsiveContainer width="100%" height={320}>
              <BarChart data={byCat} layout="vertical" margin={{ left: 20 }}>
                <XAxis type="number" hide />
                <YAxis type="category" dataKey="name" width={110} tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} />
                <Tooltip contentStyle={tooltipStyle} formatter={(v: number) => formatCurrency(v, cur)} cursor={{ fill: "hsl(var(--muted))" }} />
                <Bar dataKey="value" radius={[0, 6, 6, 0]}>
                  {byCat.map((_, i) => <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          ) : <EmptyState message="No expenses yet" />}
        </Panel>

        <Panel className="lg:col-span-3" title="All Expenses" action={<EntityDialog title="Add Expense" fields={fields} triggerLabel="Add Expense" onSubmit={(v) => addItem("expenses", { id: newId(), ...v } as any)} />}>
          <div className="max-h-[360px] space-y-3 overflow-y-auto pr-1">
            {data.expenses.length ? data.expenses.map((e) => (
              <ItemRow
                key={e.id}
                title={e.name}
                subtitle={e.category}
                badge={<Badge tone={e.recurring ? "primary" : "gold"}>{e.recurring ? "Recurring" : "One-time"}</Badge>}
                values={[{ label: "Amount", value: formatCurrency(e.amount, cur), emphasis: true }]}
                actions={
                  <EntityDialog
                    title="Edit Expense"
                    fields={expenseFields(e, cur)}
                    trigger={<EditButton />}
                    onSubmit={(v) => updateItem("expenses", e.id, v)}
                  />
                }
                onDelete={() => removeItem("expenses", e.id)}
              />
            )) : <EmptyState message="Add your first expense" />}
          </div>
        </Panel>
      </div>
    </div>
  );
}
