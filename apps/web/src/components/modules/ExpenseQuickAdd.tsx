import { useState } from "react";
import { EXPENSE_CATEGORIES, Expense, ExpenseCategory } from "@/types/finance";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";
import {
  Plus, X, ChevronDown, ChevronUp, Home, Zap, Droplets, Wifi, Smartphone, ShoppingCart, Fuel,
  Bus, ShieldCheck, GraduationCap, Clapperboard, Utensils, Plane, Stethoscope, MoreHorizontal,
} from "lucide-react";
import { toast } from "sonner";

export type NewExpense = Omit<Expense, "id">;

// Shown up front; the rest stay behind "More" so the picker is not a wall of tiles.
const PRIMARY_CATEGORIES: ExpenseCategory[] = [
  "House Rent / EMI", "Groceries", "Electricity Bill", "Fuel", "Mobile", "Internet", "Transportation",
];

const CAT_ICON: Record<ExpenseCategory, typeof Home> = {
  "House Rent / EMI": Home,
  "Electricity Bill": Zap,
  "Water Bill": Droplets,
  Internet: Wifi,
  Mobile: Smartphone,
  Groceries: ShoppingCart,
  Fuel: Fuel,
  Transportation: Bus,
  "LIC Premium": ShieldCheck,
  "School Fees": GraduationCap,
  Entertainment: Clapperboard,
  "Dining Out": Utensils,
  Travel: Plane,
  Medical: Stethoscope,
  Other: MoreHorizontal,
};

// Shorter labels keep the tiles readable at small sizes.
const CAT_SHORT: Partial<Record<ExpenseCategory, string>> = {
  "House Rent / EMI": "Rent / EMI",
  "Electricity Bill": "Electricity",
  "Water Bill": "Water",
  "LIC Premium": "LIC",
  "School Fees": "School",
};

const today = () => new Date().toISOString().slice(0, 10);

export function ExpenseQuickAdd({ currency, onAdd }: { currency: string; onAdd: (expense: NewExpense) => void }) {
  const [category, setCategory] = useState<ExpenseCategory | null>(null);
  const [amount, setAmount] = useState("");
  const [recurring, setRecurring] = useState(true);
  const [name, setName] = useState("");
  const [date, setDate] = useState(today);
  const [showAll, setShowAll] = useState(false);
  const [showDetails, setShowDetails] = useState(false);

  const visible = showAll ? EXPENSE_CATEGORIES : PRIMARY_CATEGORIES;

  const select = (next: ExpenseCategory) => {
    setCategory(next);
    setName("");
    setShowDetails(false);
  };

  const reset = () => {
    setCategory(null);
    setAmount("");
    setName("");
    setDate(today());
    setShowDetails(false);
  };

  const add = () => {
    if (!category) return;
    const value = Number(amount);
    if (!Number.isFinite(value) || value <= 0) {
      toast.error("Enter an amount greater than zero");
      return;
    }
    onAdd({ name: name.trim() || category, category, amount: value, recurring, date });
    setAmount("");
    setName("");
    setShowDetails(false);
  };

  const SelectedIcon = category ? CAT_ICON[category] : Plus;

  return (
    <div className="space-y-4 rounded-xl border border-dashed border-border p-4">
      <div>
        <p className="text-sm font-medium">What do you want to add?</p>
        <p className="text-xs text-muted-foreground">Pick a category, then enter the amount.</p>
      </div>

      <div className="grid grid-cols-3 gap-3 sm:grid-cols-4 lg:grid-cols-6">
        {visible.map((c) => {
          const Icon = CAT_ICON[c];
          const active = category === c;
          return (
            <button
              key={c}
              type="button"
              onClick={() => select(c)}
              aria-pressed={active}
              className={cn(
                "flex flex-col items-center gap-2 rounded-2xl border bg-card p-3 text-center transition",
                active
                  ? "border-primary bg-primary/5 shadow-[var(--shadow-card)]"
                  : "border-border hover:border-primary/50 hover:shadow-[var(--shadow-card)]",
              )}
            >
              <span
                className={cn(
                  "flex h-10 w-10 items-center justify-center rounded-xl",
                  active ? "bg-primary text-primary-foreground" : "bg-primary/10 text-primary",
                )}
              >
                <Icon className="h-5 w-5" />
              </span>
              <span className="text-xs font-medium">{CAT_SHORT[c] ?? c}</span>
            </button>
          );
        })}
        <button
          type="button"
          onClick={() => setShowAll((s) => !s)}
          className="flex flex-col items-center gap-2 rounded-2xl border border-border bg-muted/40 p-3 text-center transition hover:border-primary/50"
        >
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-background text-muted-foreground">
            {showAll ? <ChevronUp className="h-5 w-5" /> : <MoreHorizontal className="h-5 w-5" />}
          </span>
          <span className="text-xs font-medium">{showAll ? "Less" : "More"}</span>
        </button>
      </div>

      {category && (
        <div className="space-y-4 rounded-xl border border-border bg-background/40 p-4">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <SelectedIcon className="h-4 w-4" />
              </span>
              <span className="font-semibold">{category}</span>
            </div>
            <Button variant="ghost" size="icon" aria-label="Clear selection" onClick={reset}>
              <X className="h-4 w-4" />
            </Button>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
            <div className="flex-1 space-y-2">
              <Label htmlFor="quick-expense-amount">Amount</Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">{currency}</span>
                <Input
                  id="quick-expense-amount"
                  type="number"
                  inputMode="decimal"
                  min={0}
                  placeholder="0"
                  className="pl-7"
                  value={amount}
                  autoFocus
                  onChange={(e) => setAmount(e.target.value)}
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
              <Plus className="h-4 w-4" /> Add Expense
            </Button>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <Switch id="quick-expense-recurring" checked={recurring} onCheckedChange={setRecurring} />
              <Label htmlFor="quick-expense-recurring" className="text-sm font-normal text-muted-foreground">
                {recurring ? "Repeats every month" : "One-time expense"}
              </Label>
            </div>
            <button
              type="button"
              onClick={() => setShowDetails((s) => !s)}
              className="inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline"
            >
              {showDetails ? "Hide details" : "Add name & date"}
              {showDetails ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
            </button>
          </div>

          {showDetails && (
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="quick-expense-name">Name (optional)</Label>
                <Input
                  id="quick-expense-name"
                  placeholder={category}
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="quick-expense-date">Date</Label>
                <Input
                  id="quick-expense-date"
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                />
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
