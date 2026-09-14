import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { useFinance, newId } from "@/lib/finance/store";
import { useAuth } from "@/lib/auth/store";
import { ageFromDob } from "@/lib/finance/profile";
import {
  EmploymentType,
  FIRE_GOAL_DESCRIPTIONS,
  FIRE_GOAL_TYPES,
  FIRE_POST_RETIREMENT_YEARS,
  FamilyMember,
  FamilyMemberDraft,
  Goal,
} from "@/types/finance";
import { Panel, ItemRow, EmptyState, Badge } from "./shared";
import { ExpenseQuickAdd } from "./ExpenseQuickAdd";
import { FamilyMemberFields } from "./FamilyMemberFields";
import { GoalQuickAdd } from "./GoalQuickAdd";
import { IncomeQuickAdd } from "./IncomeQuickAdd";
import { InsuranceQuickAdd } from "./InsuranceQuickAdd";
import { InvestmentQuickAdd } from "./InvestmentQuickAdd";
import { LoanQuickAdd } from "./LoanQuickAdd";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import {
  Check, ChevronLeft, ChevronRight, User, Wallet, Receipt, Landmark,
  TrendingUp, ShieldCheck, PartyPopper, ShieldAlert, Target, Save,
} from "lucide-react";
import { toast } from "sonner";
import { firePathTargets, formatCurrency } from "@/lib/finance/calculations";
import {
  resizeFamilyMembers,
  toSavedFamilyMembers,
  validateEmergencyDraft,
  validateSetupProfile,
  type FieldErrors,
  type SetupDraftHandle,
} from "@/lib/finance/setup-validation";

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
  summary: (item: Record<string, unknown> & { id?: string }, cur: string) => {
    title: string;
    subtitle?: string;
    badge?: string;
    value: string;
  };
}

type ProfileDraft = {
  retirementAge: number;
  currency: string;
  inflationRate: number;
  dependents: number;
  employmentType: EmploymentType;
  familyMembers: FamilyMemberDraft[];
};

const fmt = (n: number, cur: string) =>
  `${cur}${Number(n || 0).toLocaleString("en-IN")}`;

const SAVE_BTN = "gap-2 rounded-xl ring-2 ring-primary ring-offset-2";

function isFireGoal(goal: Goal) {
  return FIRE_GOAL_TYPES.some((type) => type === goal.type);
}

function hasValidFireGoal(goals: Goal[]) {
  return goals.some((goal) => isFireGoal(goal) && goal.targetAmount > 0);
}

function asFamilyMembers(members: FamilyMember[] | FamilyMemberDraft[] | undefined, dependents: number) {
  return resizeFamilyMembers(members ?? [], dependents);
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
  const entityRef = useRef<SetupDraftHandle>(null);

  const [profile, setProfile] = useState<ProfileDraft>({
    retirementAge: data.profile.retirementAge,
    currency: data.profile.currency,
    inflationRate: data.profile.inflationRate,
    dependents: data.profile.dependents,
    employmentType: data.profile.employmentType,
    familyMembers: asFamilyMembers(data.profile.familyMembers, data.profile.dependents),
  });
  const [profileSaved, setProfileSaved] = useState(() => validateSetupProfile({
    retirementAge: data.profile.retirementAge,
    inflationRate: data.profile.inflationRate,
    dependents: data.profile.dependents,
    employmentType: data.profile.employmentType,
    familyMembers: asFamilyMembers(data.profile.familyMembers, data.profile.dependents),
  }).ok);
  const [profileErrors, setProfileErrors] = useState<FieldErrors>({});

  useEffect(() => {
    if (loading) return;
    const next: ProfileDraft = {
      retirementAge: data.profile.retirementAge,
      currency: data.profile.currency,
      inflationRate: data.profile.inflationRate,
      dependents: data.profile.dependents,
      employmentType: data.profile.employmentType,
      familyMembers: asFamilyMembers(data.profile.familyMembers, data.profile.dependents),
    };
    setProfile(next);
    setProfileSaved(validateSetupProfile(next).ok);
    setProfileErrors({});
  }, [
    loading,
    data.profile.retirementAge,
    data.profile.currency,
    data.profile.inflationRate,
    data.profile.dependents,
    data.profile.employmentType,
    data.profile.familyMembers,
  ]);

  const ENTITY_STEPS: EntityStep[] = [
    {
      key: "incomes", label: "Income", icon: Wallet,
      summary: (i, c) => ({ title: String(i.name ?? ""), badge: String(i.type ?? ""), value: `${fmt(Number(i.monthlyAmount), c)}/mo` }),
    },
    {
      key: "expenses", label: "Expenses", icon: Receipt,
      summary: (e, c) => ({ title: String(e.name ?? ""), badge: String(e.category ?? ""), value: fmt(Number(e.amount), c) }),
    },
    {
      key: "loans", label: "Loans", icon: Landmark,
      summary: (l, c) => ({ title: String(l.name ?? ""), badge: String(l.type ?? ""), value: `${fmt(Number(l.emi), c)}/mo` }),
    },
    {
      key: "investments", label: "Investments", icon: TrendingUp,
      summary: (iv, c) => ({ title: String(iv.name ?? ""), badge: String(iv.type ?? ""), value: fmt(Number(iv.currentValue), c) }),
    },
    {
      key: "insurances", label: "Insurance", icon: ShieldCheck,
      summary: (ins, c) => ({ title: String(ins.name ?? ""), badge: String(ins.type ?? ""), value: fmt(Number(ins.coverage), c) }),
    },
    {
      key: "goals", label: "Goals", icon: Target,
      summary: (goal, c) => ({
        title: String(goal.name ?? ""),
        badge: String(goal.type ?? ""),
        value: fmt(Number(goal.targetAmount), c),
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
      familyMembers: profile.familyMembers.filter((member): member is FamilyMember =>
        Boolean(member.relationship && member.gender && member.name && member.dob && member.occupation),
      ),
    },
  });
  const [emergencyDraft, setEmergencyDraft] = useState({
    targetAmount: emergencyGoal?.targetAmount ?? 0,
    currentSaved: emergencyGoal?.currentSaved ?? 0,
    targetDate:
      emergencyGoal?.targetDate ??
      new Date(Date.now() + 31536000000).toISOString().slice(0, 10),
  });
  const [emergencySaved, setEmergencySaved] = useState(() => (emergencyGoal?.targetAmount ?? 0) > 0);
  const [emergencyErrors, setEmergencyErrors] = useState<FieldErrors>({});

  useEffect(() => {
    if (!emergencyGoal) return;
    setEmergencyDraft({
      targetAmount: emergencyGoal.targetAmount,
      currentSaved: emergencyGoal.currentSaved,
      targetDate: emergencyGoal.targetDate,
    });
    setEmergencySaved(emergencyGoal.targetAmount > 0);
  }, [emergencyGoal]);

  const saveProfile = async () => {
    const result = validateSetupProfile(profile);
    if ("errors" in result) {
      setProfileErrors(result.errors);
      toast.error("Complete required profile fields before saving");
      return false;
    }
    setProfileErrors({});
    await updateProfile({
      retirementAge: result.value.retirementAge ?? profile.retirementAge,
      currency: profile.currency.trim() || "₹",
      inflationRate: result.value.inflationRate ?? profile.inflationRate,
      dependents: result.value.dependents ?? profile.dependents,
      employmentType: result.value.employmentType ?? profile.employmentType,
      familyMembers: toSavedFamilyMembers(profile.familyMembers),
    });
    setProfileSaved(true);
    toast.success("Profile saved");
    return true;
  };

  const saveEmergencyFund = async () => {
    const result = validateEmergencyDraft(emergencyDraft);
    if ("errors" in result) {
      setEmergencyErrors(result.errors);
      toast.error(result.errors.targetAmount ?? "Set an emergency fund target amount before continuing");
      return false;
    }
    if (!emergencyGoal) {
      toast.error("Set an emergency fund target amount before continuing");
      return false;
    }
    setEmergencyErrors({});
    try {
      const ok = await updateItem("goals", emergencyGoal.id, {
        targetAmount: emergencyDraft.targetAmount,
        currentSaved: emergencyDraft.currentSaved,
        targetDate: emergencyDraft.targetDate,
      });
      if (!ok) return false;
      setEmergencySaved(true);
      toast.success("Emergency fund saved");
      return true;
    } catch {
      return false;
    }
  };

  const canLeaveCurrentStep = async () => {
    if (isProfile) {
      const result = validateSetupProfile(profile);
      if ("errors" in result) {
        setProfileErrors(result.errors);
        toast.error("Complete required profile fields before continuing");
        return false;
      }
      if (!profileSaved) {
        toast.error("Save your profile before continuing");
        return false;
      }
      return true;
    }
    if (isEmergency) {
      const result = validateEmergencyDraft(emergencyDraft);
      if ("errors" in result) {
        setEmergencyErrors(result.errors);
        toast.error(result.errors.targetAmount ?? "Set an emergency fund target amount before continuing");
        return false;
      }
      if (!emergencySaved) {
        toast.error("Save the emergency fund before continuing");
        return false;
      }
      return true;
    }
    if (entityStep && !entityRef.current?.canProceed()) return false;
    if (entityStep?.key === "goals" && !hasValidFireGoal(data.goals)) {
      toast.error("Choose and save one FIRE goal before continuing");
      return false;
    }
    return true;
  };

  const goToStep = async (index: number) => {
    if (index === step) return;
    if (index > step && !(await canLeaveCurrentStep())) return;
    setStep(index);
  };

  const goNext = async () => {
    if (!(await canLeaveCurrentStep())) return;
    setStep((current) => current + 1);
  };

  const finish = async () => {
    if (!(await saveProfile())) return;
    if (!(await saveEmergencyFund())) return;
    if (!hasValidFireGoal(data.goals)) {
      toast.error("Choose Lean FIRE, Fat FIRE, or Coast FIRE before finishing");
      return;
    }
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

  const namedDependents = profile.familyMembers
    .map((member) => member.name.trim())
    .filter(Boolean)
    .join(", ");

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
              onClick={() => void goToStep(index)}
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
            errors={profileErrors}
            setProfile={(next) => {
              setProfile(next);
              setProfileSaved(false);
            }}
            onSave={() => void saveProfile()}
          />
        )}

        {isEmergency && (
          <EmergencyFundSetup
            value={emergencyDraft}
            currency={cur}
            errors={emergencyErrors}
            onChange={(next) => {
              setEmergencyDraft(next);
              setEmergencySaved(false);
            }}
            onSave={() => void saveEmergencyFund()}
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
            <div className="space-y-5" key={entityStep.key}>
              {entityStep.key === "incomes" && (
                <IncomeQuickAdd
                  ref={entityRef}
                  dualActions
                  currency={cur}
                  onAdd={(income) => addItem("incomes", { id: newId(), ...income })}
                  onUpdate={(id, income) => updateItem("incomes", id, income)}
                />
              )}
              {entityStep.key === "expenses" && (
                <ExpenseQuickAdd
                  ref={entityRef}
                  dualActions
                  currency={cur}
                  onAdd={(expense) => addItem("expenses", { id: newId(), ...expense })}
                  onUpdate={(id, expense) => updateItem("expenses", id, expense)}
                />
              )}
              {entityStep.key === "loans" && (
                <LoanQuickAdd
                  ref={entityRef}
                  dualActions
                  currency={cur}
                  onAdd={(loan) => addItem("loans", { id: newId(), ...loan })}
                  onUpdate={(id, loan) => updateItem("loans", id, loan)}
                />
              )}
              {entityStep.key === "investments" && (
                <InvestmentQuickAdd
                  ref={entityRef}
                  dualActions
                  currency={cur}
                  onAdd={(investment) => addItem("investments", { id: newId(), ...investment })}
                  onUpdate={(id, investment) => updateItem("investments", id, investment)}
                />
              )}
              {entityStep.key === "insurances" && (
                <InsuranceQuickAdd
                  ref={entityRef}
                  dualActions
                  currency={cur}
                  onAdd={(insurance) => addItem("insurances", { id: newId(), ...insurance })}
                  onUpdate={(id, insurance) => updateItem("insurances", id, insurance)}
                />
              )}
              {entityStep.key === "goals" && (
                <GoalQuickAdd
                  ref={entityRef}
                  dualActions
                  currency={cur}
                  fireTargets={fireTargets}
                  onAdd={(goal) => addItem("goals", { id: newId(), ...goal })}
                  onUpdate={(id, goal) => updateItem("goals", id, goal)}
                />
              )}
              <EntityList
                stepDef={entityStep}
                items={data[entityStep.key]}
                cur={cur}
                onRemove={(id) => void removeItem(entityStep.key, id)}
              />
            </div>
          </>
        )}

        {isReview && (
          <div className="space-y-3">
            <ReviewRow label="Profile" value={`${accountName}, age ${accountAge} · retire at ${profile.retirementAge} · ${profile.employmentType}`} />
            <ReviewRow
              label="Dependents"
              value={namedDependents ? `${profile.dependents} (${namedDependents})` : String(profile.dependents)}
            />
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

function FieldError({ message }: { message?: string }) {
  if (!message) return null;
  return <p className="text-xs font-medium text-danger">{message}</p>;
}

function EmergencyFundSetup({
  value,
  currency,
  errors,
  onChange,
  onSave,
}: {
  value: EmergencyFundDraft;
  currency: string;
  errors: FieldErrors;
  onChange: (value: EmergencyFundDraft) => void;
  onSave: () => void;
}) {
  const set = (key: keyof EmergencyFundDraft, next: number | string) =>
    onChange({ ...value, [key]: next });

  return (
    <div className="grid grid-cols-2 gap-4 rounded-xl border border-dashed border-border p-4">
      <Field label="Target Amount" error={errors.targetAmount}>
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
            aria-invalid={Boolean(errors.targetAmount)}
          />
        </div>
      </Field>
      <Field label="Already Saved" error={errors.currentSaved}>
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
            aria-invalid={Boolean(errors.currentSaved)}
          />
        </div>
      </Field>
      <Field label="Target Date" span={2} error={errors.targetDate}>
        <Input
          type="date"
          value={value.targetDate}
          onChange={(event) => set("targetDate", event.target.value)}
          aria-invalid={Boolean(errors.targetDate)}
        />
      </Field>
      <p className="col-span-2 text-sm text-muted-foreground">
        Keep this fund liquid. The planner uses this goal before debt and
        investment recommendations.
      </p>
      <div className="col-span-2">
        <Button className={SAVE_BTN} onClick={onSave}>
          <Save className="h-4 w-4" /> Save emergency fund
        </Button>
      </div>
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

function ProfileForm({
  profile,
  errors,
  setProfile,
  onSave,
}: {
  profile: ProfileDraft & { name: string; age: number };
  errors: FieldErrors;
  setProfile: (profile: ProfileDraft) => void;
  onSave: () => void;
}) {
  const set = <K extends keyof ProfileDraft>(key: K, value: ProfileDraft[K]) => {
    if (key === "dependents") {
      const count = Number(value) || 0;
      setProfile({
        retirementAge: profile.retirementAge,
        currency: profile.currency,
        inflationRate: profile.inflationRate,
        employmentType: profile.employmentType,
        dependents: count,
        familyMembers: resizeFamilyMembers(profile.familyMembers, count),
      });
      return;
    }
    setProfile({
      retirementAge: profile.retirementAge,
      currency: profile.currency,
      inflationRate: profile.inflationRate,
      dependents: profile.dependents,
      employmentType: profile.employmentType,
      familyMembers: profile.familyMembers,
      [key]: value,
    });
  };

  return (
    <div className="grid grid-cols-2 gap-4">
      <Field label="Full Name" span={2}>
        <Input value={profile.name} disabled />
      </Field>
      <Field label="Age">
        <Input type="number" value={profile.age} disabled />
      </Field>
      <Field label="Retirement Age" htmlFor="setup-retirement-age" error={errors.retirementAge}>
        <Input
          id="setup-retirement-age"
          type="number"
          value={profile.retirementAge}
          onChange={(e) => set("retirementAge", Number(e.target.value))}
          aria-invalid={Boolean(errors.retirementAge)}
        />
      </Field>
      <Field label="Employment Type" span={2} error={errors.employmentType}>
        <Select value={profile.employmentType} onValueChange={(v) => set("employmentType", v as EmploymentType)}>
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>
            {["Salaried", "Business Owner", "Freelancer", "Retired"].map((o) => (
              <SelectItem key={o} value={o}>{o}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </Field>
      <Field label="Dependents" htmlFor="setup-dependents" error={errors.dependents ?? errors.familyMembers}>
        <Input
          id="setup-dependents"
          type="number"
          min={0}
          max={20}
          value={profile.dependents}
          onChange={(e) => set("dependents", Number(e.target.value))}
          aria-invalid={Boolean(errors.dependents ?? errors.familyMembers)}
        />
      </Field>
      <Field label="Inflation Rate (%)" htmlFor="setup-inflation" error={errors.inflationRate}>
        <Input
          id="setup-inflation"
          type="number"
          value={profile.inflationRate}
          onChange={(e) => set("inflationRate", Number(e.target.value))}
          aria-invalid={Boolean(errors.inflationRate)}
        />
      </Field>
      <FamilyMemberFields
        members={profile.familyMembers}
        errors={errors}
        onChange={(index, patch) => {
          const familyMembers = profile.familyMembers.map((member, i) =>
            i === index ? { ...member, ...patch } : member,
          );
          setProfile({
            retirementAge: profile.retirementAge,
            currency: profile.currency,
            inflationRate: profile.inflationRate,
            dependents: profile.dependents,
            employmentType: profile.employmentType,
            familyMembers,
          });
        }}
      />
      <div className="col-span-2">
        <Button className={SAVE_BTN} onClick={onSave}>
          <Save className="h-4 w-4" /> Save profile
        </Button>
      </div>
    </div>
  );
}

function Field({
  label,
  span,
  error,
  htmlFor,
  children,
}: {
  label: string;
  span?: 1 | 2;
  error?: string;
  htmlFor?: string;
  children: React.ReactNode;
}) {
  return (
    <div className={span === 2 ? "col-span-2 space-y-2" : "space-y-2"}>
      <Label htmlFor={htmlFor} className={error ? "text-danger" : undefined}>{label}</Label>
      {children}
      <FieldError message={error} />
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
