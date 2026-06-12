import { useFinance, newId } from "@/lib/finance/store";
import {
  formatCurrency, formatPercent, totalInvestments, monthlySIP, weightedReturn,
  assetAllocation, investmentProjection,
} from "@/lib/finance/calculations";
import { InvestmentType } from "@/types/finance";
import { EntityDialog, FieldDef } from "@/components/EntityDialog";
import { Panel, ItemRow, EmptyState, Badge, CHART_COLORS, tooltipStyle } from "./shared";
import { StatCard } from "@/components/StatCard";
import { TrendingUp, Repeat, Gauge, Wallet } from "lucide-react";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from "recharts";

const TYPES: InvestmentType[] = [
  "Mutual Funds", "Stocks", "Bonds", "Fixed Deposits", "PPF", "EPF", "NPS", "Gold", "Real Estate", "Crypto", "Other",
];

export function InvestmentModule() {
  const { data, addItem, removeItem } = useFinance();
  const cur = data.profile.currency;
  const alloc = assetAllocation(data);

  const fields: FieldDef[] = [
    { name: "name", label: "Investment Name", type: "text", span: 2 },
    { name: "type", label: "Type", type: "select", options: TYPES, span: 2 },
    { name: "currentValue", label: "Current Value", type: "number", prefix: cur },
    { name: "monthlySip", label: "Monthly SIP", type: "number", prefix: cur },
    { name: "expectedReturn", label: "Expected Return (%)", type: "number" },
    { name: "horizon", label: "Horizon (years)", type: "number" },
  ];

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Portfolio Value" value={formatCurrency(totalInvestments(data), cur, true)} icon={Wallet} accent="primary" />
        <StatCard label="Monthly SIP" value={formatCurrency(monthlySIP(data), cur)} icon={Repeat} accent="gold" />
        <StatCard label="Blended CAGR" value={formatPercent(weightedReturn(data))} icon={Gauge} accent="primary" />
        <StatCard label="Holdings" value={String(data.investments.length)} icon={TrendingUp} accent="default" />
      </div>

      <div className="grid gap-6 lg:grid-cols-5">
        <Panel className="lg:col-span-2" title="Asset Allocation">
          {alloc.length ? (
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie data={alloc} dataKey="value" nameKey="name" innerRadius={55} outerRadius={95} paddingAngle={3}>
                  {alloc.map((_, i) => <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />)}
                </Pie>
                <Tooltip contentStyle={tooltipStyle} formatter={(v: number) => formatCurrency(v, cur)} />
                <Legend wrapperStyle={{ fontSize: "0.7rem" }} />
              </PieChart>
            </ResponsiveContainer>
          ) : <EmptyState message="No investments yet" />}
        </Panel>

        <Panel className="lg:col-span-3" title="Holdings" action={<EntityDialog title="Add Investment" fields={fields} triggerLabel="Add Investment" onSubmit={(v) => addItem("investments", { id: newId(), ...v } as any)} />}>
          <div className="max-h-[340px] space-y-3 overflow-y-auto pr-1">
            {data.investments.length ? data.investments.map((inv) => (
              <ItemRow
                key={inv.id}
                title={inv.name}
                subtitle={`SIP ${formatCurrency(inv.monthlySip, cur)} · ${inv.horizon}y horizon`}
                badge={<Badge tone="primary">{inv.type}</Badge>}
                values={[
                  { label: `Proj. (${inv.horizon}y)`, value: formatCurrency(investmentProjection(inv), cur, true) },
                  { label: "Current", value: formatCurrency(inv.currentValue, cur, true), emphasis: true },
                ]}
                onDelete={() => removeItem("investments", inv.id)}
              />
            )) : <EmptyState message="Add your first investment" />}
          </div>
        </Panel>
      </div>
    </div>
  );
}
