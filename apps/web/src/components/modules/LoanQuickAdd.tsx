import { forwardRef, useState } from "react";
import { Loan, LoanType } from "@/types/finance";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Plus, X, ChevronDown, ChevronUp, Home, User, Briefcase, Car, GraduationCap } from "lucide-react";
import { toast } from "sonner";
import { type SetupDraftHandle } from "@/lib/finance/setup-validation";
import { useSetupQuickAdd, type SetupQuickAddProps } from "@/lib/finance/use-setup-quick-add";
import { QuickTypePicker, QuickTypeTile, WizardSaveButton } from "./QuickTypePicker";

export type NewLoan = Omit<Loan, "id">;

const LOAN_TILES: QuickTypeTile<LoanType>[] = [
  { value: "Home Loan", label: "Home", icon: Home },
  { value: "Personal Loan", label: "Personal", icon: User },
  { value: "Vehicle Loan", label: "Vehicle", icon: Car },
  { value: "Education Loan", label: "Education", icon: GraduationCap },
  { value: "Business Loan", label: "Business", icon: Briefcase },
];

const RATE_DEFAULT: Record<LoanType, number> = {
  "Home Loan": 8.5,
  "Personal Loan": 13,
  "Business Loan": 12,
  "Vehicle Loan": 9.5,
  "Education Loan": 9,
};

const TENURE_DEFAULT: Record<LoanType, number> = {
  "Home Loan": 240,
  "Personal Loan": 48,
  "Business Loan": 60,
  "Vehicle Loan": 60,
  "Education Loan": 96,
};

function parsePositive(raw: string): number | null {
  const value = Number(raw);
  if (!Number.isFinite(value) || value <= 0) return null;
  return value;
}

export const LoanQuickAdd = forwardRef<SetupDraftHandle, SetupQuickAddProps<NewLoan>>(function LoanQuickAdd(
  { currency, onAdd, onUpdate, dualActions = false },
  ref,
) {
  const [type, setType] = useState<LoanType | null>(null);
  const [outstanding, setOutstanding] = useState("");
  const [emi, setEmi] = useState("");
  const [interestRate, setInterestRate] = useState("");
  const [remainingTenure, setRemainingTenure] = useState("");
  const [name, setName] = useState("");
  const [emiDay, setEmiDay] = useState("5");
  const [prepaymentAllowed, setPrepaymentAllowed] = useState(true);
  const [showDetails, setShowDetails] = useState(false);

  const resetFields = () => {
    setType(null);
    setOutstanding("");
    setEmi("");
    setInterestRate("");
    setRemainingTenure("");
    setName("");
    setEmiDay("5");
    setPrepaymentAllowed(true);
    setShowDetails(false);
  };

  const { errors, markDirty, saveItem, clearDraft } = useSetupQuickAdd<NewLoan>(ref, {
    dualActions,
    key: "loans",
    getValues: () => ({
      name: name.trim() || type || "",
      type: type ?? "",
      outstanding: Number(outstanding),
      emi: Number(emi),
      interestRate: Number(interestRate) || (type ? RATE_DEFAULT[type] : 0),
      remainingTenure: Number(remainingTenure) || (type ? TENURE_DEFAULT[type] : 0),
      emiDay: Number(emiDay) || 5,
      prepaymentAllowed,
    }),
    reset: resetFields,
  });

  const select = (next: LoanType) => {
    setType(next);
    setName("");
    setInterestRate(String(RATE_DEFAULT[next]));
    setRemainingTenure(String(TENURE_DEFAULT[next]));
    setShowDetails(false);
    markDirty();
  };

  const payload = (): NewLoan | null => {
    if (!type) return null;
    const outstandingValue = parsePositive(outstanding);
    const emiValue = parsePositive(emi);
    if (outstandingValue === null || emiValue === null) return null;
    const rate = Number(interestRate);
    const tenure = Number(remainingTenure);
    const day = Number(emiDay);
    return {
      name: name.trim() || type,
      type,
      outstanding: outstandingValue,
      emi: emiValue,
      interestRate: Number.isFinite(rate) ? rate : RATE_DEFAULT[type],
      remainingTenure: Number.isFinite(tenure) && tenure > 0 ? tenure : TENURE_DEFAULT[type],
      emiDay: Number.isFinite(day) && day >= 1 && day <= 31 ? day : 5,
      prepaymentAllowed,
    };
  };

  const add = () => {
    const item = payload();
    if (!item) {
      toast.error("Enter outstanding and EMI greater than zero");
      return;
    }
    void onAdd(item);
    setOutstanding("");
    setEmi("");
    setName("");
    setShowDetails(false);
  };

  const saveDraft = async () => {
    const item = payload() ?? {
      name: name.trim() || type || "",
      type: type ?? "Home Loan",
      outstanding: Number(outstanding) || 0,
      emi: Number(emi) || 0,
      interestRate: Number(interestRate) || 0,
      remainingTenure: Number(remainingTenure) || 0,
      emiDay: Number(emiDay) || 5,
      prepaymentAllowed,
    };
    await saveItem(item, onAdd, onUpdate);
  };

  const SelectedIcon = type ? (LOAN_TILES.find((t) => t.value === type)?.icon ?? Plus) : Plus;

  return (
    <div className="space-y-4 rounded-xl border border-dashed border-border p-4">
      <QuickTypePicker
        prompt="What loan do you want to add?"
        hint="Pick a type, then enter outstanding and EMI."
        items={LOAN_TILES}
        selected={type}
        onSelect={select}
      />

      {type && (
        <div className="space-y-4 rounded-xl border border-border bg-background/40 p-4">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <SelectedIcon className="h-4 w-4" />
              </span>
              <span className="font-semibold">{type}</span>
            </div>
            <Button variant="ghost" size="icon" aria-label="Clear selection" onClick={clearDraft}>
              <X className="h-4 w-4" />
            </Button>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="quick-loan-outstanding" className={errors.outstanding ? "text-danger" : undefined}>
                Outstanding
              </Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">{currency}</span>
                <Input
                  id="quick-loan-outstanding"
                  type="number"
                  inputMode="decimal"
                  min={0}
                  placeholder="0"
                  className="pl-7"
                  value={outstanding}
                  autoFocus
                  aria-invalid={Boolean(errors.outstanding)}
                  onChange={(e) => {
                    setOutstanding(e.target.value);
                    markDirty();
                  }}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      void (dualActions ? saveDraft() : add());
                    }
                  }}
                />
              </div>
              {errors.outstanding && <p className="text-xs font-medium text-danger">{errors.outstanding}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="quick-loan-emi" className={errors.emi ? "text-danger" : undefined}>Monthly EMI</Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">{currency}</span>
                <Input
                  id="quick-loan-emi"
                  type="number"
                  inputMode="decimal"
                  min={0}
                  placeholder="0"
                  className="pl-7"
                  value={emi}
                  aria-invalid={Boolean(errors.emi)}
                  onChange={(e) => {
                    setEmi(e.target.value);
                    markDirty();
                  }}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      void (dualActions ? saveDraft() : add());
                    }
                  }}
                />
              </div>
              {errors.emi && <p className="text-xs font-medium text-danger">{errors.emi}</p>}
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-xs text-muted-foreground">
              Rate {interestRate || RATE_DEFAULT[type]}% · {remainingTenure || TENURE_DEFAULT[type]} months left
            </p>
            <button
              type="button"
              onClick={() => setShowDetails((s) => !s)}
              className="inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline"
            >
              {showDetails ? "Hide details" : "Name, rate & tenure"}
              {showDetails ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
            </button>
          </div>

          {showDetails && (
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor="quick-loan-name">Name (optional)</Label>
                <Input
                  id="quick-loan-name"
                  placeholder={type}
                  value={name}
                  onChange={(e) => {
                    setName(e.target.value);
                    markDirty();
                  }}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="quick-loan-rate">Interest rate (%)</Label>
                <Input
                  id="quick-loan-rate"
                  type="number"
                  inputMode="decimal"
                  min={0}
                  value={interestRate}
                  onChange={(e) => {
                    setInterestRate(e.target.value);
                    markDirty();
                  }}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="quick-loan-tenure">Remaining tenure (months)</Label>
                <Input
                  id="quick-loan-tenure"
                  type="number"
                  inputMode="numeric"
                  min={1}
                  value={remainingTenure}
                  onChange={(e) => {
                    setRemainingTenure(e.target.value);
                    markDirty();
                  }}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="quick-loan-day">EMI day of month</Label>
                <Input
                  id="quick-loan-day"
                  type="number"
                  inputMode="numeric"
                  min={1}
                  max={31}
                  value={emiDay}
                  onChange={(e) => {
                    setEmiDay(e.target.value);
                    markDirty();
                  }}
                />
              </div>
              <div className="flex items-center gap-3">
                <Switch
                  id="quick-loan-prepay"
                  checked={prepaymentAllowed}
                  onCheckedChange={(checked) => {
                    setPrepaymentAllowed(checked);
                    markDirty();
                  }}
                />
                <Label htmlFor="quick-loan-prepay" className="text-sm font-normal text-muted-foreground">
                  Prepayment allowed
                </Label>
              </div>
            </div>
          )}

          {dualActions ? (
            <WizardSaveButton onSave={() => void saveDraft()} saveLabel="Save" />
          ) : (
            <Button className="gap-2 rounded-xl" onClick={add}>
              <Plus className="h-4 w-4" /> Add Loan
            </Button>
          )}
        </div>
      )}
    </div>
  );
});
