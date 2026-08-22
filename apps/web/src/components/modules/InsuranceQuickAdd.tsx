import { useState } from "react";
import { Insurance, InsuranceType } from "@/types/finance";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Plus, X, ChevronDown, ChevronUp, HeartPulse, Shield, Car, Bike, Home } from "lucide-react";
import { toast } from "sonner";
import { QuickTypePicker, QuickTypeTile } from "./QuickTypePicker";

export type NewInsurance = Omit<Insurance, "id">;

const INSURANCE_TILES: QuickTypeTile<InsuranceType>[] = [
  { value: "Term Insurance", label: "Term", icon: Shield },
  { value: "Health Insurance", label: "Health", icon: HeartPulse },
  { value: "Car Insurance", label: "Car", icon: Car },
  { value: "Bike Insurance", label: "Bike", icon: Bike },
  { value: "Home Insurance", label: "Home", icon: Home },
];

const todayPlusYear = () => {
  const d = new Date();
  d.setFullYear(d.getFullYear() + 1);
  return d.toISOString().slice(0, 10);
};

function parsePositive(raw: string): number | null {
  const value = Number(raw);
  if (!Number.isFinite(value) || value <= 0) return null;
  return value;
}

export function InsuranceQuickAdd({ currency, onAdd }: { currency: string; onAdd: (insurance: NewInsurance) => void }) {
  const [type, setType] = useState<InsuranceType | null>(null);
  const [coverage, setCoverage] = useState("");
  const [annualPremium, setAnnualPremium] = useState("");
  const [name, setName] = useState("");
  const [expiryDate, setExpiryDate] = useState(todayPlusYear);
  const [showDetails, setShowDetails] = useState(false);

  const select = (next: InsuranceType) => {
    setType(next);
    setName("");
    setShowDetails(false);
  };

  const reset = () => {
    setType(null);
    setCoverage("");
    setAnnualPremium("");
    setName("");
    setExpiryDate(todayPlusYear());
    setShowDetails(false);
  };

  const add = () => {
    if (!type) return;
    const cover = parsePositive(coverage);
    const premium = Number(annualPremium);
    if (cover === null) {
      toast.error("Enter a coverage amount greater than zero");
      return;
    }
    if (!Number.isFinite(premium) || premium < 0) {
      toast.error("Enter a valid annual premium");
      return;
    }
    onAdd({
      name: name.trim() || type,
      type,
      coverage: cover,
      annualPremium: premium || 0,
      expiryDate: expiryDate || todayPlusYear(),
    });
    setCoverage("");
    setAnnualPremium("");
    setName("");
    setShowDetails(false);
  };

  const SelectedIcon = type ? (INSURANCE_TILES.find((t) => t.value === type)?.icon ?? Plus) : Plus;

  return (
    <div className="space-y-4 rounded-xl border border-dashed border-border p-4">
      <QuickTypePicker
        prompt="What policy do you want to add?"
        hint="Pick a type, then enter coverage and premium."
        items={INSURANCE_TILES}
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
              <Label htmlFor="quick-ins-cover">Coverage</Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">{currency}</span>
                <Input
                  id="quick-ins-cover"
                  type="number"
                  inputMode="decimal"
                  min={0}
                  placeholder="0"
                  className="pl-7"
                  value={coverage}
                  autoFocus
                  onChange={(e) => setCoverage(e.target.value)}
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
              <Label htmlFor="quick-ins-premium">Annual premium</Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">{currency}</span>
                <Input
                  id="quick-ins-premium"
                  type="number"
                  inputMode="decimal"
                  min={0}
                  placeholder="0"
                  className="pl-7"
                  value={annualPremium}
                  onChange={(e) => setAnnualPremium(e.target.value)}
                />
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-xs text-muted-foreground">Expires {expiryDate || todayPlusYear()}</p>
            <button
              type="button"
              onClick={() => setShowDetails((s) => !s)}
              className="inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline"
            >
              {showDetails ? "Hide details" : "Name & expiry"}
              {showDetails ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
            </button>
          </div>

          {showDetails && (
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="quick-ins-name">Policy name (optional)</Label>
                <Input id="quick-ins-name" placeholder={type} value={name} onChange={(e) => setName(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="quick-ins-expiry">Expiry date</Label>
                <Input id="quick-ins-expiry" type="date" value={expiryDate} onChange={(e) => setExpiryDate(e.target.value)} />
              </div>
            </div>
          )}

          <Button className="gap-2 rounded-xl" onClick={add}>
            <Plus className="h-4 w-4" /> Add Policy
          </Button>
        </div>
      )}
    </div>
  );
}
