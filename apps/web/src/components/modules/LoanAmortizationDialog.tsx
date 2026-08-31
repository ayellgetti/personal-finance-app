import { useEffect, useState } from "react";
import { RotateCcw, TableProperties } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { formatCurrency, formatPercent } from "@/lib/finance/calculations";
import {
  calculatorApiError,
  previewCalculator,
  type CalculatorResult,
} from "@/lib/finance/calculator-remote";
import type { Loan } from "@/types/finance";
import { LoanResultPanel } from "./CalculatorsModule";

export function LoanAmortizationDialog({
  loan,
  currency,
}: {
  loan: Loan;
  currency: string;
}) {
  const [open, setOpen] = useState(false);
  const [result, setResult] = useState<CalculatorResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [prepaymentAmount, setPrepaymentAmount] = useState(0);
  const [increasedMonthlyPayment, setIncreasedMonthlyPayment] = useState(0);
  const principal = loan.outstanding;

  useEffect(() => {
    if (!open) {
      setPrepaymentAmount(0);
      setIncreasedMonthlyPayment(0);
    }
  }, [open, loan.id]);

  useEffect(() => {
    if (!open) {
      return;
    }
    let cancelled = false;
    setResult(null);
    setError(null);
    const timer = window.setTimeout(() => {
      void (async () => {
        try {
          const next = await previewCalculator({
            type: "loan",
            principal,
            annualRatePct: loan.interestRate,
            months: Math.max(1, Math.round(loan.remainingTenure)),
            ...(loan.emi > 0 ? { monthlyPayment: loan.emi } : {}),
            ...(loan.prepaymentAllowed && prepaymentAmount > 0
              ? { prepaymentAmount }
              : {}),
            ...(increasedMonthlyPayment > 0
              ? { increasedMonthlyPayment }
              : {}),
          });
          if (!cancelled) {
            setResult(next);
          }
        } catch (requestError) {
          if (!cancelled) {
            setError(calculatorApiError(requestError));
          }
        }
      })();
    }, 300);
    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [
    open,
    principal,
    loan.interestRate,
    loan.remainingTenure,
    loan.emi,
    loan.prepaymentAllowed,
    prepaymentAmount,
    increasedMonthlyPayment,
  ]);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button type="button" variant="ghost" size="sm" className="text-xs">
          <TableProperties className="mr-1.5 h-4 w-4" />
          View amortization
        </Button>
      </DialogTrigger>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-5xl">
        <DialogHeader>
          <DialogTitle className="font-display">
            {loan.name} amortization
          </DialogTitle>
          <DialogDescription>
            {formatCurrency(principal, currency)} outstanding at{" "}
            {formatPercent(loan.interestRate)} over{" "}
            {Math.max(1, Math.round(loan.remainingTenure))} months.
          </DialogDescription>
        </DialogHeader>

        <div className="rounded-xl border border-border bg-muted/20 p-4">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="text-sm font-semibold">Close this loan earlier</p>
              <p className="mt-1 text-xs text-muted-foreground">
                Try an immediate prepayment, a higher EMI from next month, or
                both. This simulation does not change your saved loan.
              </p>
            </div>
            {(prepaymentAmount > 0 || increasedMonthlyPayment > 0) && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => {
                  setPrepaymentAmount(0);
                  setIncreasedMonthlyPayment(0);
                }}
              >
                <RotateCcw className="mr-1.5 h-4 w-4" />
                Reset
              </Button>
            )}
          </div>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor={`prepayment-${loan.id}`}>
                One-time prepayment
              </Label>
              <Input
                id={`prepayment-${loan.id}`}
                type="number"
                min={0}
                max={principal}
                step={1_000}
                value={prepaymentAmount || ""}
                placeholder="₹0"
                disabled={!loan.prepaymentAllowed}
                onChange={(event) =>
                  setPrepaymentAmount(
                    event.target.value === "" ? 0 : Number(event.target.value),
                  )
                }
              />
              {!loan.prepaymentAllowed && (
                <p className="text-xs text-muted-foreground">
                  This loan is marked as not allowing prepayment.
                </p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor={`higher-emi-${loan.id}`}>
                New higher monthly EMI
              </Label>
              <Input
                id={`higher-emi-${loan.id}`}
                type="number"
                min={loan.emi > 0 ? loan.emi + 1 : 1}
                step={500}
                value={increasedMonthlyPayment || ""}
                placeholder={`More than ${formatCurrency(loan.emi, currency)}`}
                onChange={(event) =>
                  setIncreasedMonthlyPayment(
                    event.target.value === "" ? 0 : Number(event.target.value),
                  )
                }
              />
            </div>
          </div>
        </div>

        {error ? (
          <p className="py-10 text-center text-sm text-danger">{error}</p>
        ) : result ? (
          <div className="space-y-6">
            <LoanResultPanel
              result={result}
              principal={principal}
              showTable={false}
            />
            <LoanResultPanel
              result={result}
              principal={principal}
              showPreview={false}
            />
          </div>
        ) : (
          <p className="py-10 text-center text-sm text-muted-foreground">
            Building the amortization schedule…
          </p>
        )}
      </DialogContent>
    </Dialog>
  );
}
