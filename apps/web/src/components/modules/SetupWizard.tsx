import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useFinance, newId } from "@/lib/finance/store";
import { useAuth } from "@/lib/auth/store";
import { ageFromDob } from "@/lib/finance/profile";
import {
  EmploymentType,
  EXPENSE_CATEGORIES,
  FIRE_GOAL_DESCRIPTIONS,
  FIRE_GOAL_TYPES,
  FIRE_POST_RETIREMENT_YEARS,
  FireGoalType,
  FinanceData,
  Goal,
  USER_GOAL_TYPES,
} from "@/types/finance";
import { FieldDef } from "@/components/EntityDialog";
import { Panel, ItemRow, EmptyState, Badge } from "./shared";
import { ExpenseQuickAdd } from "./ExpenseQuickAdd";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";
import {
  Plus, Check, ChevronLeft, ChevronRight, User, Wallet, Receipt, Landmark,
  TrendingUp, ShieldCheck, PartyPopper, ShieldAlert, Target,
} from "lucide-react";
import { toast } from "sonner";
import { firePathTargets, formatCurrency } from "@/lib/finance/calculations";

type Collection =
  | "incomes"
  | "expenses"
  | "loans"
  | "investments"
  | "insurances"
  | "goals";

interface EntityStep {
  key: Collection;
  label: string;
  icon: typeof Wallet;
  fields: FieldDef[];
  summary: (item: any, cur: string) => { title: string; subtitle?: string; badge?: string; value: string };
}

const fmt = (n: number, cur: string) =>
  `${cur}${Number(n || 0).toLocaleString("en-IN")}`;

function isFireGoal(goal: Goal) {
  return FIRE_GOAL_TYPES.some((type) => type === goal.type);
}

function hasValidFireGoal(goals: Goal[]) {
  return goals.some((goal) => isFireGoal(goal) && goal.targetAmount > 0);
}

export function SetupWizard({ onDone }: { onDone: () => void }) {
  const { user } = useAuth();
  const {
    data,
    loading,
    addItem,
    removeItem,
    updateItem,
    updateProfile,
  } = useFinance();
  const cur = data.profile.currency;
  const accountName = user?.name ?? data.profile.name;
  const accountAge = user ? ageFromDob(user.dob) : data.profile.age;

  const [profile, setProfile] = useState({
    retirementAge: data.profile.retirementAge,
    currency: data.profile.currency,
    inflationRate: data.profile.inflationRate,
    dependents: data.profile.dependents,
    employmentType: data.profile.employmentType,
  });

  useEffect(() => {
    if (loading) return;
    setProfile({
      retirementAge: data.profile.retirementAge,
      currency: data.profile.currency,
      inflationRate: data.profile.inflationRate,
      dependents: data.profile.dependents,
      employmentType: data.profile.employmentType,
    });
  }, [
    loading,
    data.profile.retirementAge,
    data.profile.currency,
    data.profile.inflationRate,
    data.profile.dependents,
    data.profile.employmentType,
  ]);

  const today = new Date().toISOString().slice(0, 10);

  const ENTITY_STEPS: EntityStep[] = [
    {
      key: "incomes", label: "Income", icon: Wallet,
      fields: [
        { name: "name", label: "Source Name", type: "text", span: 2 },
        { name: "type", label: "Income Type", type: "select", span: 2, options: ["Salary", "Business Income", "Rental Income", "Dividend Income", "Freelancing Income", "Interest Income", "Other Income"] },
        { name: "monthlyAmount", label: "Monthly Amount", type: "number", prefix: cur },
        { name: "growthRate", label: "Growth Rate (%)", type: "number" },
        { name: "startDate", label: "Start Date", type: "date", span: 2, defaultValue: today },
      ],
      summary: (i, c) => ({ title: i.name, badge: i.type, value: `${fmt(i.monthlyAmount, c)}/mo` }),
    },
    {
      key: "expenses", label: "Expenses", icon: Receipt,
      // Expenses use the category-first ExpenseQuickAdd form instead of the generic field grid.
      fields: [
        { name: "name", label: "Expense Name", type: "text", span: 2 },
        { name: "category", label: "Category", type: "select", span: 2, options: EXPENSE_CATEGORIES },
        { name: "amount", label: "Amount", type: "number", prefix: cur },
        { name: "recurring", label: "Monthly Recurring", type: "switch" },
        { name: "date", label: "Date", type: "date", span: 2, defaultValue: today },
      ],
      summary: (e, c) => ({ title: e.name, badge: e.category, value: fmt(e.amount, c) }),
    },
    {
      key: "loans", label: "Loans", icon: Landmark,
      fields: [
        { name: "name", label: "Loan Name", type: "text", span: 2 },
        { name: "type", label: "Loan Type", type: "select", span: 2, options: ["Home Loan", "Personal Loan", "Business Loan", "Vehicle Loan", "Education Loan"] },
        { name: "outstanding", label: "Outstanding", type: "number", prefix: cur },
        { name: "interestRate", label: "Interest Rate (%)", type: "number" },
        { name: "emi", label: "EMI", type: "number", prefix: cur },
        { name: "remainingTenure", label: "Tenure (months)", type: "number" },
        { name: "emiDay", label: "Day of the Month", type: "number", defaultValue: 5 },
        { name: "prepaymentAllowed", label: "Prepayment Allowed", type: "switch" },
      ],
      summary: (l, c) => ({ title: l.name, badge: l.type, value: `${fmt(l.emi, c)}/mo` }),
    },
    {
      key: "investments", label: "Investments", icon: TrendingUp,
      fields: [
        { name: "name", label: "Investment Name", type: "text", span: 2 },
        { name: "type", label: "Type", type: "select", span: 2, options: ["Mutual Funds", "Stocks", "Bonds", "Fixed Deposits", "PPF", "EPF", "NPS", "Gold", "Real Estate", "Crypto", "Other"] },
        { name: "currentValue", label: "Current Value", type: "number", prefix: cur },
        { name: "monthlySip", label: "Monthly SIP", type: "number", prefix: cur },
        { name: "expectedReturn", label: "Expected Return (%)", type: "number" },
        { name: "horizon", label: "Horizon (years)", type: "number" },
      ],
      summary: (iv, c) => ({ title: iv.name, badge: iv.type, value: fmt(iv.currentValue, c) }),
    },
    {
      key: "insurances", label: "Insurance", icon: ShieldCheck,
      fields: [
        { name: "name", label: "Policy Name", type: "text", span: 2 },
        { name: "type", label: "Type", type: "select", span: 2, options: ["Term Insurance", "Health Insurance", "Car Insurance", "Bike Insurance", "Home Insurance"] },
        { name: "coverage", label: "Coverage Amount", type: "number", prefix: cur },
        { name: "annualPremium", label: "Annual Premium", type: "number", prefix: cur },
        { name: "expiryDate", label: "Expiry Date", type: "date", span: 2, defaultValue: today },
      ],
      summary: (ins, c) => ({ title: ins.name, badge: ins.type, value: fmt(ins.coverage, c) }),
    },
    {
      key: "goals", label: "Goals", icon: Target,
      fields: [
        { name: "name", label: "Goal Name", type: "text", span: 2, defaultValue: "My FIRE Goal" },
        { name: "type", label: "Goal Type", type: "select", span: 2, options: USER_GOAL_TYPES, optionDescriptions: FIRE_GOAL_DESCRIPTIONS },
        { name: "targetAmount", label: "Target Amount", type: "number", prefix: cur },
        { name: "currentSaved", label: "Already Saved", type: "number", prefix: cur },
        {
          name: "targetDate",
          label: "Target Date",
          type: "date",
          span: 2,
          defaultValue: new Date(Date.now() + 10 * 31536000000).toISOString().slice(0, 10),
        },
        { name: "priority", label: "Priority", type: "select", span: 2, options: ["High", "Medium", "Low"] },
      ],
      summary: (goal, c) => ({
        title: goal.name,
        badge: goal.type,
        value: fmt(goal.targetAmount, c),
      }),
    },
  ];

  const STEPS = [
    { id: "profile", label: "Profile", icon: User },
    ...ENTITY_STEPS.filter((s) => s.key !== "goals").map((s) => ({
      id: s.key,
      label: s.label,
      icon: s.icon,
    })),
    { id: "emergency", label: "Emergency Fund", icon: ShieldAlert },
    ...ENTITY_STEPS.filter((s) => s.key === "goals").map((s) => ({
      id: s.key,
      label: s.label,
      icon: s.icon,
    })),
    { id: "review", label: "Review", icon: PartyPopper },
  ];

  const totalSteps = STEPS.length;
  const [step, setStep] = useState(0);
  const currentStep = STEPS[step];
  const isProfile = currentStep?.id === "profile";
  const isEmergency = currentStep?.id === "emergency";
  const isReview = currentStep?.id === "review";
  const entityStep = ENTITY_STEPS.find((item) => item.key === currentStep?.id) ?? null;
  const emergencyGoal = data.goals.find((goal) => goal.type === "Emergency Fund");
  const fireTargets = firePathTargets({
    ...data,
    profile: {
      ...data.profile,
      ...profile,
      retirementAge: Number(profile.retirementAge) || data.profile.retirementAge,
      inflationRate: Number(profile.inflationRate) || 0,
    },
  });
  const [emergencyDraft, setEmergencyDraft] = useState({
    targetAmount: emergencyGoal?.targetAmount ?? 0,
    currentSaved: emergencyGoal?.currentSaved ?? 0,
    targetDate:
      emergencyGoal?.targetDate ??
      new Date(Date.now() + 31536000000).toISOString().slice(0, 10),
  });

  useEffect(() => {
    if (!emergencyGoal) return;
    setEmergencyDraft({
      targetAmount: emergencyGoal.targetAmount,
      currentSaved: emergencyGoal.currentSaved,
      targetDate: emergencyGoal.targetDate,
    });
  }, [emergencyGoal]);

  const saveEmergencyFund = async () => {
    if (!emergencyGoal || emergencyDraft.targetAmount <= 0) {
      toast.error("Set an emergency fund target amount before continuing");
      return false;
    }
    try {
      await updateItem("goals", emergencyGoal.id, {
        targetAmount: emergencyDraft.targetAmount,
        currentSaved: emergencyDraft.currentSaved,
        targetDate: emergencyDraft.targetDate,
      });
      return true;
    } catch {
      return false;
    }
  };

  const goNext = async () => {
    if (isEmergency && !(await saveEmergencyFund())) return;
    if (
      entityStep?.key === "goals" &&
      !hasValidFireGoal(data.goals)
    ) {
      toast.error("Choose and save one FIRE goal before continuing");
      return;
    }
    setStep((current) => current + 1);
  };

  const finish = async () => {
    if (!(await saveEmergencyFund())) return;
    if (!hasValidFireGoal(data.goals)) {
      toast.error("Choose Lean FIRE, Fat FIRE, or Coast FIRE before finishing");
      return;
    }
    await updateProfile({
      retirementAge: Number(profile.retirementAge) || data.profile.retirementAge,
      currency: profile.currency.trim() || "₹",
      inflationRate: Number(profile.inflationRate) || 0,
      dependents: Number(profile.dependents) || 0,
      employmentType: profile.employmentType as EmploymentType,
    });
    toast.success("Setup saved");
    onDone();
  };

  const stepIcon = isProfile
    ? User
    : isEmergency
      ? ShieldAlert
      : isReview
        ? PartyPopper
        : entityStep!.icon;
  const StepIcon = stepIcon;
  const stepTitle = isProfile
    ? "Your Profile"
    : isEmergency
      ? "Emergency Fund"
      : isReview
        ? "Review & Finish"
        : entityStep!.label;

  if (loading) {
    return (
      <div className="mx-auto max-w-3xl">
        <Panel>
          <p className="text-sm text-muted-foreground">Loading your saved details from the server…</p>
        </Panel>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <p className="text-sm text-muted-foreground">
        New here?{" "}
        <Link to="/guide" className="font-medium text-primary hover:underline">
          Read the Arjun Mehta walkthrough
        </Link>{" "}
        to see dashboard, cash flow, and advisor suggestions before you enter your own numbers.
      </p>
      <div className="flex flex-wrap gap-2">
        {STEPS.map((item, index) => {
          const Icon = item.icon;
          const current = index === step;
          const done = index < step;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => setStep(index)}
              className={cn(
                "flex items-center gap-2 rounded-full border px-3 py-1.5 text-sm font-medium transition-colors",
                current && "border-primary bg-primary text-primary-foreground",
                done && !current && "border-primary/30 bg-primary/10 text-primary",
                !current && !done && "border-border bg-background text-muted-foreground hover:border-primary/40 hover:text-foreground",
              )}
            >
              <Icon className="h-3.5 w-3.5" />
              <span>{index + 1}. {item.label}</span>
            </button>
          );
        })}
      </div>

      <Panel>
        <div className="mb-5 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <StepIcon className="h-5 w-5" />
          </div>
          <div>
            <h3 className="font-display text-lg font-semibold">{stepTitle}</h3>
            <p className="text-sm text-muted-foreground">
              {isProfile
                ? "Retirement, dependents, and inflation are saved to your financial profile"
                : isEmergency
                ? "Set the required safety buffer used by your planner and advisor"
                : isReview
                ? "Confirm everything, then save"
                : entityStep?.key === "goals"
                ? `Choose one required FIRE path. Targets use the expenses you added, inflation to retirement, and ${FIRE_POST_RETIREMENT_YEARS} years after you stop working.`
                : `Your saved ${entityStep!.label.toLowerCase()} from the server. Add more if needed.`}
            </p>
          </div>
        </div>

        {isProfile && (
          <ProfileForm
            profile={{ ...profile, name: accountName, age: accountAge }}
            setProfile={setProfile}
          />
        )}

        {isEmergency && (
          <EmergencyFundSetup
            value={emergencyDraft}
            currency={cur}
            onChange={setEmergencyDraft}
          />
        )}

        {entityStep && (
          <>
            {entityStep.key === "goals" && (
              <div className="mb-5 grid gap-3 sm:grid-cols-3">
                {FIRE_GOAL_TYPES.map((title) => {
                  const suggested = fireTargets[title];
                  return (
                    <div key={title} className="rounded-xl border border-border bg-muted/40 p-3">
                      <p className="font-semibold">{title}</p>
                      <p className="mt-1 text-xs text-muted-foreground">{FIRE_GOAL_DESCRIPTIONS[title]}</p>
                      {suggested > 0 && (
                        <p className="mt-2 text-xs font-medium text-foreground">
                          Suggested: {formatCurrency(suggested, cur, true)}
                        </p>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
            <EntitySection
              key={entityStep.key}
              stepDef={entityStep}
              items={data[entityStep.key]}
              cur={cur}
              fireTargets={entityStep.key === "goals" ? fireTargets : undefined}
              onAdd={(v) => void addItem(entityStep.key, { id: newId(), ...v } as FinanceData[typeof entityStep.key][number])}
              onRemove={(id) => void removeItem(entityStep.key, id)}
            />
          </>
        )}

        {isReview && (
          <div className="space-y-3">
            <ReviewRow label="Profile" value={`${accountName}, age ${accountAge} · retire at ${profile.retirementAge} · ${profile.employmentType}`} />
            <ReviewRow label="Dependents" value={String(profile.dependents)} />
            <ReviewRow label="Inflation" value={`${profile.inflationRate}%`} />
            <ReviewRow
              label="Emergency Fund"
              value={`${fmt(emergencyDraft.targetAmount, cur)} target`}
            />
            <ReviewRow
              label="FIRE Path"
              value={data.goals.find(isFireGoal)?.type ?? "Not selected"}
            />
            {ENTITY_STEPS.filter((s) => s.key !== "goals").map((s) => (
              <ReviewRow key={s.key} label={s.label} value={`${data[s.key].length} saved`} />
            ))}
            <ReviewRow
              label="Other Goals"
              value={`${data.goals.filter((goal) => goal.type !== "Emergency Fund" && !isFireGoal(goal)).length} saved`}
            />
          </div>
        )}
      </Panel>

      <div className="flex items-center justify-between gap-3">
        <span className="text-xs text-muted-foreground">
          Emergency Fund and one FIRE path are required
        </span>
        <div className="flex gap-2">
          {step > 0 && (
            <Button variant="outline" className="gap-1 rounded-xl" onClick={() => setStep((s) => s - 1)}>
              <ChevronLeft className="h-4 w-4" /> Back
            </Button>
          )}
          {!isReview ? (
            <Button className="gap-1 rounded-xl" onClick={() => void goNext()}>
              Next <ChevronRight className="h-4 w-4" />
            </Button>
          ) : (
            <Button className="gap-1 rounded-xl" onClick={() => void finish()}>
              <Check className="h-4 w-4" /> Finish Setup
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

type EmergencyFundDraft = {
  targetAmount: number;
  currentSaved: number;
  targetDate: string;
};

function EmergencyFundSetup({
  value,
  currency,
  onChange,
}: {
  value: EmergencyFundDraft;
  currency: string;
  onChange: (value: EmergencyFundDraft) => void;
}) {
  const set = (key: keyof EmergencyFundDraft, next: number | string) =>
    onChange({ ...value, [key]: next });

  return (
    <div className="grid grid-cols-2 gap-4 rounded-xl border border-dashed border-border p-4">
      <Field label="Target Amount">
        <div className="relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
            {currency}
          </span>
          <Input
            type="number"
            min={1}
            className="pl-7"
            value={value.targetAmount}
            onChange={(event) => set("targetAmount", Number(event.target.value))}
          />
        </div>
      </Field>
      <Field label="Already Saved">
        <div className="relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
            {currency}
          </span>
          <Input
            type="number"
            min={0}
            className="pl-7"
            value={value.currentSaved}
            onChange={(event) => set("currentSaved", Number(event.target.value))}
          />
        </div>
      </Field>
      <Field label="Target Date" span={2}>
        <Input
          type="date"
          value={value.targetDate}
          onChange={(event) => set("targetDate", event.target.value)}
        />
      </Field>
      <p className="col-span-2 text-sm text-muted-foreground">
        Keep this fund liquid. The planner uses this goal before debt and
        investment recommendations.
      </p>
    </div>
  );
}

function ReviewRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between rounded-xl border border-border bg-background/40 px-4 py-3">
      <span className="font-medium">{label}</span>
      <span className="text-sm text-muted-foreground">{value}</span>
    </div>
  );
}

function ProfileForm({ profile, setProfile }: { profile: any; setProfile: (p: any) => void }) {
  const set = (k: string, v: any) => setProfile((p: any) => ({ ...p, [k]: v }));
  return (
    <div className="grid grid-cols-2 gap-4">
      <Field label="Full Name" span={2}>
        <Input value={profile.name} disabled />
      </Field>
      <Field label="Age">
        <Input type="number" value={profile.age} disabled />
      </Field>
      <Field label="Retirement Age">
        <Input type="number" value={profile.retirementAge} onChange={(e) => set("retirementAge", Number(e.target.value))} />
      </Field>
      <Field label="Employment Type" span={2}>
        <Select value={profile.employmentType} onValueChange={(v) => set("employmentType", v)}>
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>
            {["Salaried", "Business Owner", "Freelancer", "Retired"].map((o) => (
              <SelectItem key={o} value={o}>{o}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </Field>
      <Field label="Dependents">
        <Input type="number" value={profile.dependents} onChange={(e) => set("dependents", Number(e.target.value))} />
      </Field>
      <Field label="Inflation Rate (%)">
        <Input type="number" value={profile.inflationRate} onChange={(e) => set("inflationRate", Number(e.target.value))} />
      </Field>
    </div>
  );
}

function Field({ label, span, children }: { label: string; span?: 1 | 2; children: React.ReactNode }) {
  return (
    <div className={span === 2 ? "col-span-2 space-y-2" : "space-y-2"}>
      <Label>{label}</Label>
      {children}
    </div>
  );
}

function EntitySection({
  stepDef, items, cur, onAdd, onRemove, fireTargets,
}: {
  stepDef: EntityStep;
  items: any[];
  cur: string;
  onAdd: (v: any) => void;
  onRemove: (id: string) => void;
  fireTargets?: Record<FireGoalType, number>;
}) {
  const init = () => {
    const v: Record<string, any> = {};
    stepDef.fields.forEach((f) => {
      v[f.name] = f.defaultValue ?? (f.type === "number" ? 0 : f.type === "switch" ? true : f.type === "select" ? f.options?.[0] : "");
    });
    const suggested = fireTargets?.[v.type as FireGoalType];
    if (suggested && suggested > 0 && (Number(v.targetAmount) || 0) === 0) {
      v.targetAmount = Math.round(suggested);
    }
    return v;
  };
  const [values, setValues] = useState<Record<string, any>>(init);
  const set = (n: string, val: any) => setValues((v) => ({ ...v, [n]: val }));

  const applyFireType = (type: string) => {
    setValues((current) => {
      const suggested = fireTargets?.[type as FireGoalType];
      const shouldPrefill =
        suggested != null &&
        suggested > 0 &&
        (Number(current.targetAmount) || 0) === 0;
      return {
        ...current,
        type,
        ...(shouldPrefill ? { targetAmount: Math.round(suggested) } : {}),
      };
    });
  };

  const handleAdd = () => {
    if (!values.name || String(values.name).trim() === "") {
      toast.error("Please enter a name first");
      return;
    }
    if (stepDef.key === "goals" && Number(values.targetAmount) <= 0) {
      toast.error("Set a goal target amount greater than zero");
      return;
    }
    onAdd(values);
    setValues(init());
  };

  if (stepDef.key === "expenses") {
    return (
      <div className="space-y-5">
        <ExpenseQuickAdd currency={cur} onAdd={onAdd} />
        <EntityList stepDef={stepDef} items={items} cur={cur} onRemove={onRemove} />
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 gap-4 rounded-xl border border-dashed border-border p-4">
        {stepDef.fields.map((f) => (
          <div key={f.name} className={f.span === 2 || f.type === "switch" ? "col-span-2 space-y-2" : "space-y-2"}>
            <Label htmlFor={`w-${f.name}`}>{f.label}</Label>
            {f.type === "select" ? (
              <>
                <Select
                  value={String(values[f.name])}
                  onValueChange={(val) => (f.name === "type" && fireTargets ? applyFireType(val) : set(f.name, val))}
                >
                  <SelectTrigger id={`w-${f.name}`}><SelectValue /></SelectTrigger>
                  <SelectContent className="max-h-60">
                    {f.options?.map((o) => <SelectItem key={o} value={o}>{o}</SelectItem>)}
                  </SelectContent>
                </Select>
                {f.optionDescriptions?.[String(values[f.name])] && (
                  <p className="text-xs text-muted-foreground">{f.optionDescriptions[String(values[f.name])]}</p>
                )}
              </>
            ) : f.type === "switch" ? (
              <div className="flex items-center gap-3 rounded-xl border border-border p-3">
                <Switch id={`w-${f.name}`} checked={!!values[f.name]} onCheckedChange={(c) => set(f.name, c)} />
                <span className="text-sm text-muted-foreground">{values[f.name] ? "Yes" : "No"}</span>
              </div>
            ) : (
              <div className="relative">
                {f.prefix && <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">{f.prefix}</span>}
                <Input
                  id={`w-${f.name}`}
                  type={f.type}
                  value={values[f.name]}
                  className={f.prefix ? "pl-7" : ""}
                  onChange={(e) => set(f.name, f.type === "number" ? Number(e.target.value) : e.target.value)}
                />
              </div>
            )}
          </div>
        ))}
        <div className="col-span-2">
          <Button variant="outline" className="w-full gap-2 rounded-xl" onClick={handleAdd}>
            <Plus className="h-4 w-4" /> Add {stepDef.label}
          </Button>
        </div>
      </div>

      <EntityList stepDef={stepDef} items={items} cur={cur} onRemove={onRemove} />
    </div>
  );
}

function EntityList({
  stepDef, items, cur, onRemove,
}: {
  stepDef: EntityStep;
  items: { id: string }[];
  cur: string;
  onRemove: (id: string) => void;
}) {
  return (
    <div className="space-y-3">
      {items.length ? items.map((item) => {
        const s = stepDef.summary(item, cur);
        return (
          <ItemRow
            key={item.id}
            title={s.title}
            badge={s.badge ? <Badge tone="primary">{s.badge}</Badge> : undefined}
            values={[{ label: "Value", value: s.value, emphasis: true }]}
            onDelete={() => onRemove(item.id)}
          />
        );
      }) : <EmptyState message={`No ${stepDef.label.toLowerCase()} saved yet — optional, you can skip`} />}
    </div>
  );
}
