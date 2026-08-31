import { useFinance, newId } from "@/lib/finance/store";
import {
  formatCurrency, formatPercent, totalLiabilities, monthlyEMI,
  debtToIncome, loanPayoffMonths, prepaymentStrategy,
} from "@/lib/finance/calculations";
import { Loan, LoanType } from "@/types/finance";
import { EntityDialog, FieldDef } from "@/components/EntityDialog";
import { Button } from "@/components/ui/button";
import { Panel, ItemRow, EmptyState, Badge, EditButton } from "./shared";
import { StatCard } from "@/components/StatCard";
import {
  CalendarClock,
  Landmark,
  Percent,
  TableProperties,
  TrendingDown,
} from "lucide-react";
import { QuickAddDialog } from "./QuickTypePicker";
import { LoanQuickAdd } from "./LoanQuickAdd";

const TYPES: LoanType[] = ["Home Loan", "Personal Loan", "Business Loan", "Vehicle Loan", "Education Loan"];

function months(m: number) {
  if (!isFinite(m)) return "Never";
  const y = Math.floor(m / 12);
  const mm = m % 12;
  return `${y ? `${y}y ` : ""}${mm}m`;
}

function loanFields(loan?: Loan, currency?: string): FieldDef[] {
  return [
    { name: "name", label: "Loan Name", type: "text", span: 2, defaultValue: loan?.name ?? "" },
    { name: "type", label: "Loan Type", type: "select", options: TYPES, span: 2, defaultValue: loan?.type ?? TYPES[0] },
    { name: "outstanding", label: "Outstanding Amount", type: "number", prefix: currency, defaultValue: loan?.outstanding ?? 0 },
    { name: "interestRate", label: "Interest Rate (%)", type: "number", defaultValue: loan?.interestRate ?? 0 },
    { name: "emi", label: "Monthly EMI", type: "number", prefix: currency, defaultValue: loan?.emi ?? 0 },
    { name: "remainingTenure", label: "Remaining Tenure (months)", type: "number", defaultValue: loan?.remainingTenure ?? 0 },
    { name: "emiDay", label: "Day of the Month", type: "number", defaultValue: loan?.emiDay ?? 5 },
    { name: "prepaymentAllowed", label: "Prepayment Allowed", type: "switch", defaultValue: loan?.prepaymentAllowed ?? true },
  ];
}

export function LoanModule({
  onViewAmortization,
}: {
  onViewAmortization?: (loan: Loan) => void;
}) {
  const { data, loading, addItem, updateItem, removeItem } = useFinance();
  const cur = data.profile.currency;
  const dti = debtToIncome(data);
  const strategy = prepaymentStrategy(data);
  const addLoan = (
    <QuickAddDialog
      title="Quick Loan Entry"
      description="Pick a loan type, then add as many as you need before closing."
      triggerLabel="Add Loan"
    >
      <LoanQuickAdd currency={cur} onAdd={(loan) => addItem("loans", { id: newId(), ...loan })} />
    </QuickAddDialog>
  );

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Total Debt" value={formatCurrency(totalLiabilities(data), cur, true)} icon={Landmark} accent="danger" />
        <StatCard label="Monthly EMI" value={formatCurrency(monthlyEMI(data), cur)} icon={TrendingDown} accent="default" />
        <StatCard label="Debt-to-Income" value={formatPercent(dti)} sub={dti < 35 ? "Healthy" : "High"} trend={dti < 35 ? "up" : "down"} icon={Percent} accent={dti < 35 ? "primary" : "danger"} />
        <StatCard label="Loans Active" value={String(data.loans.length)} icon={CalendarClock} accent="gold" />
      </div>

      <Panel title="Loan Portfolio" action={addLoan}>
        <div className="space-y-3">
          {loading ? (
            <EmptyState message="Loading loans from your account…" />
          ) : data.loans.length ? data.loans.map((l) => {
            const payoff = loanPayoffMonths(l.outstanding, l.interestRate, l.emi);
            return (
              <ItemRow
                key={l.id}
                title={l.name}
                subtitle={`${l.type} · EMI on day ${l.emiDay || "—"} · ${l.prepaymentAllowed ? "Prepayment OK" : "No prepayment"}`}
                badge={<Badge tone="danger">{formatPercent(l.interestRate)}</Badge>}
                values={[
                  { label: "EMI", value: formatCurrency(l.emi, cur) },
                  { label: "Payoff", value: months(payoff) },
                  { label: "Outstanding", value: formatCurrency(l.outstanding, cur, true), emphasis: true },
                ]}
                actions={
                  <div className="flex items-center gap-1">
                    {onViewAmortization && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="text-xs"
                        onClick={() => onViewAmortization(l)}
                      >
                        <TableProperties className="mr-1.5 h-4 w-4" />
                        View amortization
                      </Button>
                    )}
                    <EntityDialog
                      title="Edit Loan"
                      fields={loanFields(l, cur)}
                      trigger={<EditButton />}
                      onSubmit={(v) => updateItem("loans", l.id, v)}
                    />
                  </div>
                }
                onDelete={() => removeItem("loans", l.id)}
              />
            );
          }) : <EmptyState message="No loans — debt free!" />}
        </div>
      </Panel>

      {strategy.length > 0 && (
        <Panel title="Suggested Prepayment Strategy (Avalanche)">
          <p className="mb-4 text-sm text-muted-foreground">
            Pay minimum EMIs on all loans, then channel every spare rupee toward the highest-interest loan first to minimise total interest.
          </p>
          <div className="space-y-3">
            {strategy.map((l, idx) => (
              <div key={l.id} className="flex items-center gap-4 rounded-xl border border-border bg-background/40 p-4">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/10 font-display font-bold text-primary">
                  {idx + 1}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-semibold">{l.name}</p>
                  <p className="text-sm text-muted-foreground">{formatPercent(l.interestRate)} · {formatCurrency(l.outstanding, cur, true)} outstanding</p>
                </div>
                <Badge tone={idx === 0 ? "danger" : "muted"}>{idx === 0 ? "Attack first" : "Then this"}</Badge>
              </div>
            ))}
          </div>
        </Panel>
      )}
    </div>
  );
}
