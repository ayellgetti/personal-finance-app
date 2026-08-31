import { useFinance, newId } from "@/lib/finance/store";
import { formatCurrency, monthlyExpenses, oneTimeExpenses } from "@/lib/finance/calculations";
import { EXPENSE_CATEGORIES, Expense } from "@/types/finance";
import { EntityDialog, FieldDef } from "@/components/EntityDialog";
import { Panel, ItemRow, EmptyState, Badge, EditButton, CHART_COLORS, tooltipStyle } from "./shared";
import { ExpenseQuickAdd } from "./ExpenseQuickAdd";
import { StatCard } from "@/components/StatCard";
import { Receipt, RefreshCw, Coins } from "lucide-react";
import { QuickAddDialog } from "./QuickTypePicker";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from "recharts";

function expenseFields(expense: Expense, currency: string): FieldDef[] {
  return [
    { name: "name", label: "Expense Name", type: "text", span: 2, defaultValue: expense.name },
    { name: "category", label: "Category", type: "select", options: EXPENSE_CATEGORIES, span: 2, defaultValue: expense.category },
    { name: "amount", label: "Amount", type: "number", prefix: currency, defaultValue: expense.amount },
    { name: "date", label: "Date", type: "date", defaultValue: expense.date },
    { name: "recurring", label: "Monthly Recurring (off = one-time)", type: "switch", defaultValue: expense.recurring },
  ];
}

export function ExpenseModule() {
  const { data, addItem, updateItem, removeItem } = useFinance();
  const cur = data.profile.currency;
  const recurring = monthlyExpenses(data);
  const oneTime = oneTimeExpenses(data);

  const byCat = EXPENSE_CATEGORIES.map((c) => ({
    name: c,
    value: data.expenses.filter((e) => e.category === c && e.recurring).reduce((s, e) => s + e.amount, 0),
  })).filter((x) => x.value > 0).sort((a, b) => b.value - a.value);

  const addExpense = (
    <QuickAddDialog
      title="Quick Expense Entry"
      description="Pick a category, then log as many entries as you need before closing."
      triggerLabel="Add Expense"
    >
      <ExpenseQuickAdd currency={cur} onAdd={(expense) => addItem("expenses", { id: newId(), ...expense })} />
    </QuickAddDialog>
  );

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
              <PieChart>
                <Pie
                  data={byCat}
                  dataKey="value"
                  nameKey="name"
                  innerRadius={55}
                  outerRadius={95}
                  paddingAngle={2}
                >
                  {byCat.map((_, i) => (
                    <Cell key={byCat[i]?.name ?? i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={tooltipStyle}
                  formatter={(v: number) => formatCurrency(v, cur)}
                />
                <Legend wrapperStyle={{ fontSize: "0.7rem" }} />
              </PieChart>
            </ResponsiveContainer>
          ) : <EmptyState message="No expenses yet" />}
        </Panel>

        <Panel className="lg:col-span-3" title="All Expenses" action={addExpense}>
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
