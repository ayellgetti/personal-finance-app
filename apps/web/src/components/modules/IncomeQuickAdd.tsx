import { useState } from "react";
import { Income, IncomeType } from "@/types/finance";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Plus, X, ChevronDown, ChevronUp, Wallet, Briefcase, Home, Laptop, PieChart, Landmark, MoreHorizontal,
} from "lucide-react";
import { toast } from "sonner";
import { QuickTypePicker, QuickTypeTile } from "./QuickTypePicker";

export type NewIncome = Omit<Income, "id">;

const PRIMARY: QuickTypeTile<IncomeType>[] = [
  { value: "Salary", label: "Salary", icon: Wallet },
  { value: "Business Income", label: "Business", icon: Briefcase },
  { value: "Rental Income", label: "Rental", icon: Home },
  { value: "Freelancing Income", label: "Freelancing", icon: Laptop },
  { value: "Dividend Income", label: "Dividend", icon: PieChart },
  { value: "Interest Income", label: "Interest", icon: Landmark },
];

const EXTRA: QuickTypeTile<IncomeType>[] = [
  { value: "Other Income", label: "Other", icon: MoreHorizontal },
];

const ALL_TILES = [...PRIMARY, ...EXTRA];

const GROWTH_DEFAULT: Record<IncomeType, number> = {
  Salary: 8,
  "Business Income": 10,
  "Rental Income": 5,
  "Dividend Income": 6,
  "Freelancing Income": 8,
  "Interest Income": 0,
  "Other Income": 0,
};

const today = () => new Date().toISOString().slice(0, 10);

function parsePositive(raw: string): number | null {
  const value = Number(raw);
  if (!Number.isFinite(value) || value <= 0) return null;
  return value;
}

export function IncomeQuickAdd({ currency, onAdd }: { currency: string; onAdd: (income: NewIncome) => void }) {
  const [type, setType] = useState<IncomeType | null>(null);
  const [monthlyAmount, setMonthlyAmount] = useState("");
  const [name, setName] = useState("");
  const [growthRate, setGrowthRate] = useState("");
  const [startDate, setStartDate] = useState(today);
  const [showDetails, setShowDetails] = useState(false);

  const select = (next: IncomeType) => {
    setType(next);
    setName("");
    setGrowthRate(String(GROWTH_DEFAULT[next]));
    setShowDetails(false);
  };

  const reset = () => {
    setType(null);
    setMonthlyAmount("");
    setName("");
    setGrowthRate("");
    setStartDate(today());
    setShowDetails(false);
  };

  const add = () => {
    if (!type) return;
    const amount = parsePositive(monthlyAmount);
    if (amount === null) {
      toast.error("Enter a monthly amount greater than zero");
      return;
    }
    const growth = Number(growthRate);
    onAdd({
      name: name.trim() || type,
      type,
      monthlyAmount: amount,
      growthRate: Number.isFinite(growth) && growth >= 0 ? growth : GROWTH_DEFAULT[type],
      startDate: startDate || today(),
    });
    setMonthlyAmount("");
    setName("");
    setShowDetails(false);
  };

  const SelectedIcon = type ? (ALL_TILES.find((t) => t.value === type)?.icon ?? Plus) : Plus;

  return (
    <div className="space-y-4 rounded-xl border border-dashed border-border p-4">
      <QuickTypePicker
        prompt="What income do you want to add?"
        hint="Pick a source, then enter the monthly amount."
        items={PRIMARY}
        extraItems={EXTRA}
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
            <Button variant="ghost" size="icon" aria-label="Clear selection" onClick={reset}>
              <X className="h-4 w-4" />
            </Button>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
            <div className="flex-1 space-y-2">
              <Label htmlFor="quick-income-amount">Monthly amount</Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">{currency}</span>
                <Input
                  id="quick-income-amount"
                  type="number"
                  inputMode="decimal"
                  min={0}
                  placeholder="0"
                  className="pl-7"
                  value={monthlyAmount}
                  autoFocus
                  onChange={(e) => setMonthlyAmount(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      add();
                    }
                  }}
                />
              </div>
            </div>
            <Button className="gap-2 rounded-xl sm:w-40" onClick={add}>
              <Plus className="h-4 w-4" /> Add Income
            </Button>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-xs text-muted-foreground">
              {growthRate || GROWTH_DEFAULT[type]}% annual growth · since {startDate || today()}
            </p>
            <button
              type="button"
              onClick={() => setShowDetails((s) => !s)}
              className="inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline"
            >
              {showDetails ? "Hide details" : "Name, growth & start date"}
              {showDetails ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
            </button>
          </div>

          {showDetails && (
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor="quick-income-name">Name (optional)</Label>
                <Input id="quick-income-name" placeholder={type} value={name} onChange={(e) => setName(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="quick-income-growth">Growth rate (%)</Label>
                <Input
                  id="quick-income-growth"
                  type="number"
                  inputMode="decimal"
                  min={0}
                  value={growthRate}
                  onChange={(e) => setGrowthRate(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="quick-income-start">Start date</Label>
                <Input id="quick-income-start" type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
