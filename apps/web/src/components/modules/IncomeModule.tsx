import { useFinance, newId } from "@/lib/finance/store";
import { formatCurrency, formatPercent, monthlyIncome } from "@/lib/finance/calculations";
import { IncomeType } from "@/types/finance";
import { EntityDialog, FieldDef } from "@/components/EntityDialog";
import { Panel, ItemRow, EmptyState, Badge, CHART_COLORS, tooltipStyle } from "./shared";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from "recharts";

const TYPES: IncomeType[] = [
  "Salary", "Business Income", "Rental Income", "Dividend Income", "Freelancing Income", "Interest Income", "Other Income",
];

export function IncomeModule() {
  const { data, addItem, removeItem } = useFinance();
  const cur = data.profile.currency;
  const total = monthlyIncome(data);

  const byType = TYPES.map((t) => ({
    name: t,
    value: data.incomes.filter((i) => i.type === t).reduce((s, i) => s + i.monthlyAmount, 0),
  })).filter((x) => x.value > 0);

  const fields: FieldDef[] = [
    { name: "name", label: "Source Name", type: "text", span: 2 },
    { name: "type", label: "Income Type", type: "select", options: TYPES, span: 2 },
    { name: "monthlyAmount", label: "Monthly Amount", type: "number", prefix: cur },
    { name: "growthRate", label: "Growth Rate (%)", type: "number" },
    { name: "startDate", label: "Start Date", type: "date", span: 2, defaultValue: new Date().toISOString().slice(0, 10) },
  ];

  return (
    <div className="space-y-6">
      <div className="grid gap-6 lg:grid-cols-3">
        <Panel className="lg:col-span-1" title="Income Mix">
          {byType.length ? (
            <ResponsiveContainer width="100%" height={240}>
              <PieChart>
                <Pie data={byType} dataKey="value" nameKey="name" innerRadius={55} outerRadius={90} paddingAngle={3}>
                  {byType.map((_, i) => <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />)}
                </Pie>
                <Tooltip contentStyle={tooltipStyle} formatter={(v: number) => formatCurrency(v, cur)} />
                <Legend wrapperStyle={{ fontSize: "0.7rem" }} />
              </PieChart>
            </ResponsiveContainer>
          ) : <EmptyState message="No income yet" />}
          <div className="mt-2 text-center">
            <p className="text-sm text-muted-foreground">Total Monthly Income</p>
            <p className="font-display text-2xl font-bold text-primary">{formatCurrency(total, cur)}</p>
          </div>
        </Panel>

        <Panel className="lg:col-span-2" title="Income Sources" action={<EntityDialog title="Add Income Source" fields={fields} triggerLabel="Add Income" onSubmit={(v) => addItem("incomes", { id: newId(), ...v } as any)} />}>
          <div className="space-y-3">
            {data.incomes.length ? data.incomes.map((i) => (
              <ItemRow
                key={i.id}
                title={i.name}
                subtitle={`Since ${new Date(i.startDate).toLocaleDateString("en-IN", { month: "short", year: "numeric" })}`}
                badge={<Badge tone="primary">{i.type}</Badge>}
                values={[
                  { label: "Growth", value: formatPercent(i.growthRate) },
                  { label: "Monthly", value: formatCurrency(i.monthlyAmount, cur), emphasis: true },
                ]}
                onDelete={() => removeItem("incomes", i.id)}
              />
            )) : <EmptyState message="Add your first income source" />}
          </div>
        </Panel>
      </div>
    </div>
  );
}
