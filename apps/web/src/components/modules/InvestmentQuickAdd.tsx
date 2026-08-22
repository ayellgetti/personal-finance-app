import { useState } from "react";
import { Investment, InvestmentType } from "@/types/finance";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Plus, X, ChevronDown, ChevronUp, Layers, TrendingUp, Landmark, Vault, PiggyBank,
  Building2, Umbrella, Gem, Home, Bitcoin, MoreHorizontal,
} from "lucide-react";
import { toast } from "sonner";
import { QuickTypePicker, QuickTypeTile } from "./QuickTypePicker";

export type NewInvestment = Omit<Investment, "id">;

const PRIMARY: QuickTypeTile<InvestmentType>[] = [
  { value: "Mutual Funds", label: "Mutual Funds", icon: Layers },
  { value: "Stocks", label: "Stocks", icon: TrendingUp },
  { value: "PPF", label: "PPF", icon: PiggyBank },
  { value: "NPS", label: "NPS", icon: Umbrella },
  { value: "Gold", label: "Gold", icon: Gem },
  { value: "Fixed Deposits", label: "FD", icon: Vault },
];

const EXTRA: QuickTypeTile<InvestmentType>[] = [
  { value: "EPF", label: "EPF", icon: Building2 },
  { value: "Bonds", label: "Bonds", icon: Landmark },
  { value: "Real Estate", label: "Real Estate", icon: Home },
  { value: "Crypto", label: "Crypto", icon: Bitcoin },
  { value: "Other", label: "Other", icon: MoreHorizontal },
];

const ALL_TILES = [...PRIMARY, ...EXTRA];

const RETURN_DEFAULT: Record<InvestmentType, number> = {
  "Mutual Funds": 12,
  Stocks: 12,
  Bonds: 7,
  "Fixed Deposits": 7,
  PPF: 7.1,
  EPF: 8.25,
  NPS: 10,
  Gold: 8,
  "Real Estate": 8,
  Crypto: 15,
  Other: 8,
};

function parseNonNegative(raw: string): number | null {
  if (raw.trim() === "") return 0;
  const value = Number(raw);
  if (!Number.isFinite(value) || value < 0) return null;
  return value;
}

export function InvestmentQuickAdd({ currency, onAdd }: { currency: string; onAdd: (investment: NewInvestment) => void }) {
  const [type, setType] = useState<InvestmentType | null>(null);
  const [currentValue, setCurrentValue] = useState("");
  const [monthlySip, setMonthlySip] = useState("");
  const [name, setName] = useState("");
  const [expectedReturn, setExpectedReturn] = useState("");
  const [horizon, setHorizon] = useState("10");
  const [showDetails, setShowDetails] = useState(false);

  const select = (next: InvestmentType) => {
    setType(next);
    setName("");
    setExpectedReturn(String(RETURN_DEFAULT[next]));
    setShowDetails(false);
  };

  const reset = () => {
    setType(null);
    setCurrentValue("");
    setMonthlySip("");
    setName("");
    setExpectedReturn("");
    setHorizon("10");
    setShowDetails(false);
  };

  const add = () => {
    if (!type) return;
    const value = parseNonNegative(currentValue);
    const sip = parseNonNegative(monthlySip);
    if (value === null || sip === null || (value <= 0 && sip <= 0)) {
      toast.error("Enter a current value or monthly SIP greater than zero");
      return;
    }
    const rate = Number(expectedReturn);
    const years = Number(horizon);
    onAdd({
      name: name.trim() || type,
      type,
      currentValue: value,
      monthlySip: sip,
      expectedReturn: Number.isFinite(rate) ? rate : RETURN_DEFAULT[type],
      horizon: Number.isFinite(years) && years > 0 ? years : 10,
    });
    setCurrentValue("");
    setMonthlySip("");
    setName("");
    setShowDetails(false);
  };

  const SelectedIcon = type ? (ALL_TILES.find((t) => t.value === type)?.icon ?? Plus) : Plus;

  return (
    <div className="space-y-4 rounded-xl border border-dashed border-border p-4">
      <QuickTypePicker
        prompt="What investment do you want to add?"
        hint="Pick a type, then enter current value and SIP."
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

          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="quick-inv-value">Current value</Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">{currency}</span>
                <Input
                  id="quick-inv-value"
                  type="number"
                  inputMode="decimal"
                  min={0}
                  placeholder="0"
                  className="pl-7"
                  value={currentValue}
                  autoFocus
                  onChange={(e) => setCurrentValue(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      add();
                    }
                  }}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="quick-inv-sip">Monthly SIP</Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">{currency}</span>
                <Input
                  id="quick-inv-sip"
                  type="number"
                  inputMode="decimal"
                  min={0}
                  placeholder="0"
                  className="pl-7"
                  value={monthlySip}
                  onChange={(e) => setMonthlySip(e.target.value)}
                />
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-xs text-muted-foreground">
              Expected {expectedReturn || RETURN_DEFAULT[type]}% · {horizon || 10}y horizon
            </p>
            <button
              type="button"
              onClick={() => setShowDetails((s) => !s)}
              className="inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline"
            >
              {showDetails ? "Hide details" : "Name, return & horizon"}
              {showDetails ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
            </button>
          </div>

          {showDetails && (
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor="quick-inv-name">Name (optional)</Label>
                <Input id="quick-inv-name" placeholder={type} value={name} onChange={(e) => setName(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="quick-inv-return">Expected return (%)</Label>
                <Input id="quick-inv-return" type="number" inputMode="decimal" min={0} value={expectedReturn} onChange={(e) => setExpectedReturn(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="quick-inv-horizon">Horizon (years)</Label>
                <Input id="quick-inv-horizon" type="number" inputMode="numeric" min={1} value={horizon} onChange={(e) => setHorizon(e.target.value)} />
              </div>
            </div>
          )}

          <Button className="gap-2 rounded-xl" onClick={add}>
            <Plus className="h-4 w-4" /> Add Investment
          </Button>
        </div>
      )}
    </div>
  );
}
