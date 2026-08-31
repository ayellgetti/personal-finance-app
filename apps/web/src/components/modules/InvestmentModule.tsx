import { useFinance, newId } from "@/lib/finance/store";
import {
  formatCurrency, formatPercent, totalInvestments, monthlySIP, weightedReturn,
  assetAllocation, investmentProjection, investmentProjectionSchedule,
} from "@/lib/finance/calculations";
import { Investment, InvestmentType } from "@/types/finance";
import { EntityDialog, FieldDef } from "@/components/EntityDialog";
import { Panel, ItemRow, EmptyState, Badge, EditButton, CHART_COLORS, tooltipStyle } from "./shared";
import { StatCard } from "@/components/StatCard";
import { TrendingUp, Repeat, Gauge, Wallet } from "lucide-react";
import { QuickAddDialog } from "./QuickTypePicker";
import { InvestmentQuickAdd } from "./InvestmentQuickAdd";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from "recharts";
import { ProjectionScheduleDialog } from "./ProjectionScheduleDialog";

const TYPES: InvestmentType[] = [
  "Mutual Funds", "Stocks", "Bonds", "Fixed Deposits", "PPF", "EPF", "NPS", "Gold", "Real Estate", "Crypto", "Other",
];

function investmentFields(investment: Investment | undefined, currency: string): FieldDef[] {
  return [
    { name: "name", label: "Investment Name", type: "text", span: 2, defaultValue: investment?.name ?? "" },
    { name: "type", label: "Type", type: "select", options: TYPES, span: 2, defaultValue: investment?.type ?? TYPES[0] },
    { name: "currentValue", label: "Current Value", type: "number", prefix: currency, defaultValue: investment?.currentValue ?? 0 },
    { name: "monthlySip", label: "Monthly SIP", type: "number", prefix: currency, defaultValue: investment?.monthlySip ?? 0 },
    { name: "expectedReturn", label: "Expected Return (%)", type: "number", defaultValue: investment?.expectedReturn ?? 0 },
    { name: "horizon", label: "Horizon (years)", type: "number", defaultValue: investment?.horizon ?? 0 },
  ];
}

export function InvestmentModule() {
  const { data, addItem, updateItem, removeItem } = useFinance();
  const cur = data.profile.currency;
  const alloc = assetAllocation(data);

  const addInvestment = (
    <QuickAddDialog
      title="Quick Investment Entry"
      description="Pick a type, then add as many holdings as you need before closing."
      triggerLabel="Add Investment"
    >
      <InvestmentQuickAdd currency={cur} onAdd={(investment) => addItem("investments", { id: newId(), ...investment })} />
    </QuickAddDialog>
  );

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

        <Panel className="lg:col-span-3" title="Holdings" action={addInvestment}>
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
                actions={
                  <div className="flex items-center gap-1">
                    <ProjectionScheduleDialog
                      name={inv.name}
                      description={`${inv.horizon}-year projection at ${formatPercent(inv.expectedReturn)} with a ${formatCurrency(inv.monthlySip, cur)} monthly SIP.`}
                      rows={investmentProjectionSchedule(inv)}
                      currency={cur}
                    />
                    <EntityDialog
                      title="Edit Investment"
                      fields={investmentFields(inv, cur)}
                      trigger={<EditButton />}
                      onSubmit={(v) => updateItem("investments", inv.id, v)}
                    />
                  </div>
                }
                onDelete={() => removeItem("investments", inv.id)}
              />
            )) : <EmptyState message="Add your first investment" />}
          </div>
        </Panel>
      </div>
    </div>
  );
}
