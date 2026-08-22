import { useFinance, newId } from "@/lib/finance/store";
import { formatCurrency, analyzeInsurance } from "@/lib/finance/calculations";
import { Insurance, InsuranceType } from "@/types/finance";
import { EntityDialog, FieldDef } from "@/components/EntityDialog";
import { Panel, ItemRow, EmptyState, Badge, EditButton } from "./shared";
import { Progress } from "@/components/ui/progress";
import { ShieldCheck, ShieldAlert } from "lucide-react";

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
  const termPct = a.recommendedTermCover ? Math.min(100, (a.currentTermCover / a.recommendedTermCover) * 100) : 0;
  const healthPct = a.recommendedHealthCover ? Math.min(100, (a.currentHealthCover / a.recommendedHealthCover) * 100) : 0;

  const fields = insuranceFields(undefined, cur);

  const AdequacyCard = ({ title, pct, current, recommended, gap }: { title: string; pct: number; current: number; recommended: number; gap: number }) => (
    <Panel title={title}>
      <div className="mb-3 flex items-center gap-2">
        {gap > 0 ? <ShieldAlert className="h-5 w-5 text-danger" /> : <ShieldCheck className="h-5 w-5 text-success" />}
        <Badge tone={gap > 0 ? "danger" : "success"}>{gap > 0 ? "Coverage Gap" : "Adequately Covered"}</Badge>
      </div>
      <Progress value={pct} className="h-2.5" />
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
        <AdequacyCard title="Term / Life Adequacy" pct={termPct} current={a.currentTermCover} recommended={a.recommendedTermCover} gap={a.termGap} />
        <AdequacyCard title="Health Adequacy" pct={healthPct} current={a.currentHealthCover} recommended={a.recommendedHealthCover} gap={a.healthGap} />
      </div>

      <Panel title="Policies" action={<EntityDialog title="Add Insurance" fields={fields} triggerLabel="Add Policy" onSubmit={(v) => addItem("insurances", { id: newId(), ...v } as any)} />}>
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
