import { forwardRef, useState } from "react";
import {
  FIRE_GOAL_DESCRIPTIONS,
  FireGoalType,
  Goal,
  GoalType,
  Priority,
} from "@/types/finance";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Plus, X, ChevronDown, ChevronUp, Flame, Waves, Home, Car, GraduationCap,
  Heart, Palmtree, Plane, Briefcase, Sparkles,
} from "lucide-react";
import { toast } from "sonner";
import { type SetupDraftHandle } from "@/lib/finance/setup-validation";
import { useSetupQuickAdd, type SetupQuickAddProps } from "@/lib/finance/use-setup-quick-add";
import { QuickTypePicker, QuickTypeTile, WizardSaveButton } from "./QuickTypePicker";
import { cn } from "@/lib/utils";

export type NewGoal = Omit<Goal, "id">;

const PRIMARY: QuickTypeTile<GoalType>[] = [
  { value: "Dream Home", label: "Home", icon: Home },
  { value: "Dream Car", label: "Car", icon: Car },
  { value: "Child Education", label: "Education", icon: GraduationCap },
  { value: "Retirement", label: "Retirement", icon: Palmtree },
  { value: "Lean FIRE", label: "Lean FIRE", icon: Flame },
];

const EXTRA: QuickTypeTile<GoalType>[] = [
  { value: "Fat FIRE", label: "Fat FIRE", icon: Flame },
  { value: "Coast FIRE", label: "Coast FIRE", icon: Waves },
  { value: "Child Marriage", label: "Marriage", icon: Heart },
  { value: "International Vacation", label: "Vacation", icon: Plane },
  { value: "Business Expansion", label: "Business", icon: Briefcase },
  { value: "Custom Goal", label: "Custom", icon: Sparkles },
];

const ALL_TILES = [...PRIMARY, ...EXTRA];
const PRIORITIES: Priority[] = ["High", "Medium", "Low"];

const defaultTargetDate = () => new Date(Date.now() + 5 * 31536000000).toISOString().slice(0, 10);

function parsePositive(raw: string): number | null {
  const value = Number(raw);
  if (!Number.isFinite(value) || value <= 0) return null;
  return value;
}

type GoalQuickAddProps = SetupQuickAddProps<NewGoal> & {
  fireTargets?: Record<FireGoalType, number>;
};

export const GoalQuickAdd = forwardRef<SetupDraftHandle, GoalQuickAddProps>(function GoalQuickAdd(
  { currency, onAdd, onUpdate, dualActions = false, fireTargets },
  ref,
) {
  const [type, setType] = useState<GoalType | null>(null);
  const [targetAmount, setTargetAmount] = useState("");
  const [currentSaved, setCurrentSaved] = useState("");
  const [name, setName] = useState("");
  const [targetDate, setTargetDate] = useState(defaultTargetDate);
  const [priority, setPriority] = useState<Priority>("High");
  const [showDetails, setShowDetails] = useState(false);

  const resetFields = () => {
    setType(null);
    setTargetAmount("");
    setCurrentSaved("");
    setName("");
    setTargetDate(defaultTargetDate());
    setPriority("High");
    setShowDetails(false);
  };

  const { errors, markDirty, saveItem, clearDraft } = useSetupQuickAdd<NewGoal>(ref, {
    dualActions,
    key: "goals",
    getValues: () => ({
      name: name.trim() || type || "",
      type: type ?? "",
      targetAmount: Number(targetAmount),
      currentSaved: Number(currentSaved) || 0,
      targetDate: targetDate || defaultTargetDate(),
      priority,
    }),
    reset: resetFields,
  });

  const select = (next: GoalType) => {
    setType(next);
    setName("");
    setShowDetails(false);
    const suggested = fireTargets?.[next as FireGoalType];
    if (suggested && suggested > 0) {
      setTargetAmount(String(Math.round(suggested)));
    } else {
      setTargetAmount("");
    }
    markDirty();
  };

  const payload = (): NewGoal | null => {
    if (!type) return null;
    const target = parsePositive(targetAmount);
    if (target === null) return null;
    const saved = Number(currentSaved);
    return {
      name: name.trim() || type,
      type,
      targetAmount: target,
      currentSaved: Number.isFinite(saved) && saved > 0 ? saved : 0,
      targetDate: targetDate || defaultTargetDate(),
      priority,
    };
  };

  const add = () => {
    const item = payload();
    if (!item) {
      toast.error("Enter a target amount greater than zero");
      return;
    }
    void onAdd(item);
    setTargetAmount("");
    setCurrentSaved("");
    setName("");
    setShowDetails(false);
  };

  const saveDraft = async () => {
    const item = payload() ?? {
      name: name.trim() || type || "",
      type: type ?? "Dream Home",
      targetAmount: Number(targetAmount) || 0,
      currentSaved: Number(currentSaved) || 0,
      targetDate: targetDate || defaultTargetDate(),
      priority,
    };
    await saveItem(item, onAdd, onUpdate);
  };

  const SelectedIcon = type ? (ALL_TILES.find((t) => t.value === type)?.icon ?? Plus) : Plus;
  const fireHint = type && type in FIRE_GOAL_DESCRIPTIONS ? FIRE_GOAL_DESCRIPTIONS[type as FireGoalType] : null;

  return (
    <div className="space-y-4 rounded-xl border border-dashed border-border p-4">
      <QuickTypePicker
        prompt="What goal do you want to add?"
        hint="Pick a type, then enter the target. Emergency fund is set up separately above."
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
            <Button variant="ghost" size="icon" aria-label="Clear selection" onClick={clearDraft}>
              <X className="h-4 w-4" />
            </Button>
          </div>

          {fireHint && <p className="text-xs text-muted-foreground">{fireHint}</p>}

          <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
            <div className="flex-1 space-y-2">
              <Label htmlFor="quick-goal-target" className={errors.targetAmount ? "text-danger" : undefined}>
                Target amount
              </Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">{currency}</span>
                <Input
                  id="quick-goal-target"
                  type="number"
                  inputMode="decimal"
                  min={0}
                  placeholder="0"
                  className="pl-7"
                  value={targetAmount}
                  autoFocus
                  aria-invalid={Boolean(errors.targetAmount)}
                  onChange={(e) => {
                    setTargetAmount(e.target.value);
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
              {errors.targetAmount && <p className="text-xs font-medium text-danger">{errors.targetAmount}</p>}
            </div>
            {dualActions ? (
              <WizardSaveButton onSave={() => void saveDraft()} saveLabel="Save" />
            ) : (
              <Button className="gap-2 rounded-xl sm:w-40" onClick={add}>
                <Plus className="h-4 w-4" /> Add Goal
              </Button>
            )}
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-xs text-muted-foreground">
              {priority} priority · by {targetDate || defaultTargetDate()}
            </p>
            <button
              type="button"
              onClick={() => setShowDetails((s) => !s)}
              className="inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline"
            >
              {showDetails ? "Hide details" : "Name, saved & date"}
              {showDetails ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
            </button>
          </div>

          {showDetails && (
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor="quick-goal-name">Name (optional)</Label>
                <Input
                  id="quick-goal-name"
                  placeholder={type}
                  value={name}
                  onChange={(e) => {
                    setName(e.target.value);
                    markDirty();
                  }}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="quick-goal-saved">Already saved</Label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">{currency}</span>
                  <Input
                    id="quick-goal-saved"
                    type="number"
                    inputMode="decimal"
                    min={0}
                    placeholder="0"
                    className="pl-7"
                    value={currentSaved}
                    onChange={(e) => {
                      setCurrentSaved(e.target.value);
                      markDirty();
                    }}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="quick-goal-date">Target date</Label>
                <Input
                  id="quick-goal-date"
                  type="date"
                  value={targetDate}
                  onChange={(e) => {
                    setTargetDate(e.target.value);
                    markDirty();
                  }}
                />
              </div>
              <div className="space-y-2 sm:col-span-2">
                <Label>Priority</Label>
                <div className="flex gap-2">
                  {PRIORITIES.map((p) => (
                    <button
                      key={p}
                      type="button"
                      onClick={() => {
                        setPriority(p);
                        markDirty();
                      }}
                      className={cn(
                        "rounded-xl border px-3 py-1.5 text-xs font-medium transition",
                        priority === p ? "border-primary bg-primary/10 text-primary" : "border-border text-muted-foreground hover:border-primary/50",
                      )}
                    >
                      {p}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
});
