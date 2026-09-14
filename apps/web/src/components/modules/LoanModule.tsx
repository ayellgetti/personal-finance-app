import { useFinance, newId } from "@/lib/finance/store";
import {
  formatCurrency, formatPercent, totalLiabilities, monthlyEMI,
  debtToIncome, emiIncreaseInterestSaving, extraEmiInterestSaving, formatTenureMonths,
  loanPayoffMonths, prepaymentStrategy,
} from "@/lib/finance/calculations";
import { Loan, LoanType } from "@/types/finance";
import { EntityDialog, FieldDef } from "@/components/EntityDialog";
import { Panel, ItemRow, EmptyState, Badge, EditButton } from "./shared";
import { StatCard } from "@/components/StatCard";
import { CalendarClock, Landmark, Percent, TrendingDown } from "lucide-react";
import { QuickAddDialog } from "./QuickTypePicker";
import { LoanQuickAdd } from "./LoanQuickAdd";
import { LoanAmortizationDialog } from "./LoanAmortizationDialog";
import { LoanPayoffChart } from "./LoanPayoffChart";

const TYPES: LoanType[] = ["Home Loan", "Personal Loan", "Business Loan", "Vehicle Loan", "Education Loan"];

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

export function LoanModule() {
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

      <LoanPayoffChart loans={data.loans} currency={cur} />

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
                  { label: "Payoff", value: formatTenureMonths(payoff) },
                  { label: "Outstanding", value: formatCurrency(l.outstanding, cur, true), emphasis: true },
                ]}
                actions={
                  <div className="flex items-center gap-1">
                    <LoanAmortizationDialog loan={l} currency={cur} />
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
          <AvalancheWhatIf loan={strategy[0]} currency={cur} />
        </Panel>
      )}
    </div>
  );
}

function savingCopy(
  saving: ReturnType<typeof extraEmiInterestSaving>,
  currency: string,
): string | null {
  if (!saving) return null;
  const sooner = saving.monthsSaved > 0 ? ` and finish ${formatTenureMonths(saving.monthsSaved)} sooner` : "";
  if (saving.makesClosable) {
    return `This would let the loan close in ${formatTenureMonths(saving.newMonths)}, with ${formatCurrency(saving.newInterest, currency, true)} interest remaining.`;
  }
  if (saving.interestSaved > 0) {
    return `Save ${formatCurrency(saving.interestSaved, currency, true)} in interest over the remaining ${formatTenureMonths(saving.originalMonths)}${sooner}.`;
  }
  if (saving.monthsSaved > 0) {
    return `Finish ${formatTenureMonths(saving.monthsSaved)} sooner.`;
  }
  return null;
}

function AvalancheWhatIf({ loan, currency }: { loan: Loan | undefined; currency: string }) {
  if (!loan) return null;
  const extraEmi = loan.prepaymentAllowed ? extraEmiInterestSaving(loan) : null;
  const plusFive = emiIncreaseInterestSaving(loan, 5);
  const plusTen = emiIncreaseInterestSaving(loan, 10);
  const extraCopy = savingCopy(extraEmi, currency);
  const fiveCopy = savingCopy(plusFive, currency);
  const tenCopy = savingCopy(plusTen, currency);
  if (!extraCopy && !fiveCopy && !tenCopy) return null;

  return (
    <div className="mt-4 rounded-xl border border-border bg-background/40 p-4">
      <p className="font-semibold">What extra payments save on {loan.name}</p>
      <p className="mt-1 text-sm text-muted-foreground">
        Put extra rupees on this highest-rate loan first. These estimates use the current EMI and do not change your saved loan.
      </p>
      <ul className="mt-3 space-y-3 text-sm">
        {extraEmi && extraCopy && (
          <li>
            <p className="font-medium">Pay one extra EMI of {formatCurrency(extraEmi.extraNow, currency)} now</p>
            <p className="text-muted-foreground">{extraCopy}</p>
          </li>
        )}
        {!loan.prepaymentAllowed && (
          <li className="text-muted-foreground">
            This loan is marked as not allowing prepayment, so a one-off extra EMI is not shown.
          </li>
        )}
        {plusFive && fiveCopy && (
          <li>
            <p className="font-medium">
              Raise EMI by 5% to {formatCurrency(plusFive.newEmi, currency)}
              {plusFive.extraMonthly > 0 ? ` (+${formatCurrency(plusFive.extraMonthly, currency)} / month)` : ""}
            </p>
            <p className="text-muted-foreground">{fiveCopy}</p>
          </li>
        )}
        {plusTen && tenCopy && (
          <li>
            <p className="font-medium">
              Raise EMI by 10% to {formatCurrency(plusTen.newEmi, currency)}
              {plusTen.extraMonthly > 0 ? ` (+${formatCurrency(plusTen.extraMonthly, currency)} / month)` : ""}
            </p>
            <p className="text-muted-foreground">{tenCopy}</p>
          </li>
        )}
      </ul>
    </div>
  );
}
