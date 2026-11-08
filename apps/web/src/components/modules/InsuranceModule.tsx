import { useFinance, newId } from "@/lib/finance/store";
import { formatCurrency, analyzeInsurance, dataReadiness, termCoverMultiple } from "@/lib/finance/calculations";
import { Insurance, InsuranceType } from "@/types/finance";
import { EntityDialog, FieldDef } from "@/components/EntityDialog";
import { Panel, ItemRow, EmptyState, Badge, EditButton } from "./shared";
import { Progress } from "@/components/ui/progress";
import { ShieldCheck, ShieldAlert } from "lucide-react";
import { QuickAddDialog } from "./QuickTypePicker";
import { InsuranceQuickAdd } from "./InsuranceQuickAdd";

const TYPES: InsuranceType[] = ["Term Insurance", "Health Insurance", "Car Insurance", "Bike Insurance", "Home Insurance"];

function insuranceFields(insurance: Insurance | undefined, currency: string): FieldDef[] {
  return [
    { name: "name", label: "Policy Name", type: "text", span: 2, defaultValue: insurance?.name ?? "" },
    { name: "type", label: "Type", type: "select", options: TYPES, span: 2, defaultValue: insurance?.type ?? TYPES[0] },
    { name: "coverage", label: "Coverage Amount", type: "number", prefix: currency, defaultValue: insurance?.coverage ?? 0 },
    { name: "annualPremium", label: "Annual Premium", type: "number", prefix: currency, defaultValue: insurance?.annualPremium ?? 0 },
    { name: "expiryDate", label: "Expiry Date", type: "date", span: 2, defaultValue: insurance?.expiryDate ?? new Date().toISOString().slice(0, 10) },
  ];
}

export function InsuranceModule() {
  const { data, addItem, updateItem, removeItem } = useFinance();
  const cur = data.profile.currency;
  const a = analyzeInsurance(data);
  const hasIncomeForTerm = dataReadiness(data).hasIncome;
  const termRecommended = hasIncomeForTerm ? a.recommendedTermCover : 0;
  const termPct = termRecommended ? Math.min(100, (a.currentTermCover / termRecommended) * 100) : 0;
  const healthPct = a.recommendedHealthCover ? Math.min(100, (a.currentHealthCover / a.recommendedHealthCover) * 100) : 0;

  const addPolicy = (
    <QuickAddDialog
      title="Quick Policy Entry"
      description="Pick a policy type, then add as many as you need before closing."
      triggerLabel="Add Policy"
    >
      <InsuranceQuickAdd currency={cur} onAdd={(insurance) => addItem("insurances", { id: newId(), ...insurance })} />
    </QuickAddDialog>
  );

  const hasIncome = dataReadiness(data).hasIncome;

  const AdequacyCard = ({ title, note, pct, current, recommended, gap }: { title: string; note: string; pct: number; current: number; recommended: number; gap: number }) => (
    <Panel title={title}>
      <div className="mb-3 flex items-center gap-2">
        {recommended <= 0 ? <ShieldAlert className="h-5 w-5 text-muted-foreground" /> : gap > 0 ? <ShieldAlert className="h-5 w-5 text-danger" /> : <ShieldCheck className="h-5 w-5 text-success" />}
        {recommended <= 0 ? (
          <Badge tone="primary">Needs income to calculate</Badge>
        ) : (
          <Badge tone={gap > 0 ? "danger" : "success"}>{gap > 0 ? "Coverage Gap" : "Adequately Covered"}</Badge>
        )}
      </div>
      <Progress value={pct} className="h-2.5" />
      <p className="mt-2 text-xs text-muted-foreground">{note}</p>
      <div className="mt-3 grid grid-cols-3 gap-2 text-sm">
        <div><p className="text-muted-foreground">Current</p><p className="font-semibold">{formatCurrency(current, cur, true)}</p></div>
        <div><p className="text-muted-foreground">Recommended</p><p className="font-semibold">{formatCurrency(recommended, cur, true)}</p></div>
        <div><p className="text-muted-foreground">Gap</p><p className={`font-semibold ${gap > 0 ? "text-danger" : "text-success"}`}>{formatCurrency(gap, cur, true)}</p></div>
      </div>
    </Panel>
  );

  return (
    <div className="space-y-6">
      <div className="grid gap-6 md:grid-cols-2">
        <AdequacyCard title="Term / Life Adequacy" note={`Assumption: ${termCoverMultiple(data)}× your annual income (set by ${data.profile.dependents} dependent${data.profile.dependents === 1 ? "" : "s"} and ${Math.max(0, data.profile.retirementAge - data.profile.age)} years to retirement) plus loans.`} pct={termPct} current={a.currentTermCover} recommended={hasIncome ? a.recommendedTermCover : 0} gap={hasIncome ? a.termGap : 0} />
        <AdequacyCard title="Health Adequacy" note="Assumption: ₹7.5 L per person (you plus dependents), at least ₹10 L." pct={healthPct} current={a.currentHealthCover} recommended={a.recommendedHealthCover} gap={a.healthGap} />
      </div>

      <Panel title="Policies" action={addPolicy}>
        <div className="space-y-3">
          {data.insurances.length ? data.insurances.map((ins) => {
            const expired = new Date(ins.expiryDate) < new Date();
            return (
              <ItemRow
                key={ins.id}
                title={ins.name}
                subtitle={`Expires ${new Date(ins.expiryDate).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}`}
                badge={<Badge tone={expired ? "danger" : "primary"}>{expired ? "Expired" : ins.type}</Badge>}
                values={[
                  { label: "Premium/yr", value: formatCurrency(ins.annualPremium, cur) },
                  { label: "Coverage", value: formatCurrency(ins.coverage, cur, true), emphasis: true },
                ]}
                actions={
                  <EntityDialog
                    title="Edit Insurance"
                    fields={insuranceFields(ins, cur)}
                    trigger={<EditButton />}
                    onSubmit={(v) => updateItem("insurances", ins.id, v)}
                  />
                }
                onDelete={() => removeItem("insurances", ins.id)}
              />
            );
          }) : <EmptyState message="Add your first policy" />}
        </div>
      </Panel>
    </div>
  );
}
