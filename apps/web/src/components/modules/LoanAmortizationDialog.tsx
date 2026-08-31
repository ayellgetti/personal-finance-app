import { useEffect, useState } from "react";
import { TableProperties } from "lucide-react";
import { Button } from "@/components/ui/button";
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
  const principal = loan.outstanding;

  useEffect(() => {
    if (!open) {
      return;
    }
    let cancelled = false;
    setResult(null);
    setError(null);
    void (async () => {
      try {
        const next = await previewCalculator({
          type: "loan",
          principal,
          annualRatePct: loan.interestRate,
          months: Math.max(1, Math.round(loan.remainingTenure)),
          ...(loan.emi > 0 ? { monthlyPayment: loan.emi } : {}),
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
    return () => {
      cancelled = true;
    };
  }, [open, principal, loan.interestRate, loan.remainingTenure, loan.emi]);

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
