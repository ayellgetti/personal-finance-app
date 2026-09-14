import { z } from "zod";
import {
  EmploymentType,
  FAMILY_GENDERS,
  FAMILY_RELATIONSHIPS,
  FamilyMember,
  FamilyMemberDraft,
} from "@/types/finance";
import { ageFromDob } from "./profile";

export type FieldErrors = Record<string, string>;

export type SetupDraftHandle = {
  canProceed: () => boolean;
};

export type EntityDraftStatus = "empty" | "incomplete" | "complete";

const EMPLOYMENT: EmploymentType[] = ["Salaried", "Business Owner", "Freelancer", "Retired"];

export function emptyFamilyMember(): FamilyMemberDraft {
  return { name: "", relationship: "", dob: "", gender: "", occupation: "" };
}

export function resizeFamilyMembers(members: FamilyMemberDraft[], count: number): FamilyMemberDraft[] {
  const n = Math.max(0, Math.min(20, Number.isFinite(count) ? Math.trunc(count) : 0));
  if (members.length === n) return members;
  if (members.length > n) return members.slice(0, n);
  return [...members, ...Array.from({ length: n - members.length }, emptyFamilyMember)];
}

function firstIssue(error: z.ZodError): FieldErrors {
  const errors: FieldErrors = {};
  for (const issue of error.issues) {
    const path = issue.path.map(String).join(".");
    if (!path || errors[path]) continue;
    errors[path] = issue.message;
  }
  return errors;
}

function ageFromIsoDate(dob: string): number | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dob)) return null;
  const age = ageFromDob(dob);
  const birth = new Date(`${dob}T00:00:00`);
  if (Number.isNaN(birth.getTime())) return null;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  birth.setHours(0, 0, 0, 0);
  if (birth > today) return -1;
  return age;
}

const familyMemberDraftSchema = z
  .object({
    name: z.string().trim().min(1, "Enter a name"),
    relationship: z.enum(FAMILY_RELATIONSHIPS, { errorMap: () => ({ message: "Choose a relationship" }) }),
    dob: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Enter a date of birth"),
    gender: z.enum(FAMILY_GENDERS, { errorMap: () => ({ message: "Choose a gender" }) }),
    occupation: z.string().trim().min(1, "Enter an occupation"),
  })
  .superRefine((member, ctx) => {
    const age = ageFromIsoDate(member.dob);
    if (age === null) {
      ctx.addIssue({ code: "custom", message: "Enter a valid date of birth", path: ["dob"] });
      return;
    }
    if (age < 0) {
      ctx.addIssue({ code: "custom", message: "Date of birth cannot be in the future", path: ["dob"] });
      return;
    }
    if (age > 120) {
      ctx.addIssue({ code: "custom", message: "Age must be 120 or under", path: ["dob"] });
    }
  });

const setupProfileSchema = z
  .object({
    retirementAge: z.number().int().min(30, "Retirement age must be 30–90").max(90, "Retirement age must be 30–90"),
    inflationRate: z.number().min(0, "Inflation must be 0–30%").max(30, "Inflation must be 0–30%"),
    dependents: z.number().int().min(0, "Dependents must be 0–20").max(20, "Dependents must be 0–20"),
    employmentType: z.enum(EMPLOYMENT as [EmploymentType, ...EmploymentType[]], {
      errorMap: () => ({ message: "Choose employment type" }),
    }),
    familyMembers: z.array(familyMemberDraftSchema).max(20),
  })
  .superRefine((value, ctx) => {
    if (value.familyMembers.length !== value.dependents) {
      ctx.addIssue({
        code: "custom",
        message: "Add details for each dependent",
        path: ["familyMembers"],
      });
    }
  });

export type SetupProfileInput = z.infer<typeof setupProfileSchema>;

export function validateSetupProfile(input: {
  retirementAge: number;
  inflationRate: number;
  dependents: number;
  employmentType: string;
  familyMembers: FamilyMemberDraft[];
}): { ok: true; value: SetupProfileInput } | { ok: false; errors: FieldErrors } {
  const parsed = setupProfileSchema.safeParse(input);
  if (parsed.success) return { ok: true, value: parsed.data };
  return { ok: false, errors: firstIssue(parsed.error) };
}

export function validateEmergencyDraft(input: {
  targetAmount: number;
  currentSaved: number;
  targetDate: string;
}): { ok: true } | { ok: false; errors: FieldErrors } {
  const errors: FieldErrors = {};
  if (!Number.isFinite(input.targetAmount) || input.targetAmount <= 0) {
    errors.targetAmount = "Set a target amount greater than zero";
  }
  if (!Number.isFinite(input.currentSaved) || input.currentSaved < 0) {
    errors.currentSaved = "Already saved cannot be negative";
  }
  if (!input.targetDate) {
    errors.targetDate = "Choose a target date";
  }
  return Object.keys(errors).length ? { ok: false, errors } : { ok: true };
}

function positive(_value: unknown, message: string) {
  return z.number({ invalid_type_error: message }).positive(message);
}

function nonNegative(valueMessage: string) {
  return z.number({ invalid_type_error: valueMessage }).min(0, valueMessage);
}

const incomeSchema = z.object({
  name: z.string().trim().min(1, "Enter a name"),
  type: z.string().trim().min(1, "Choose an income type"),
  monthlyAmount: positive(undefined, "Enter a monthly amount greater than zero"),
  growthRate: nonNegative("Growth rate cannot be negative"),
  startDate: z.string().min(1, "Enter a start date"),
});

const expenseSchema = z.object({
  name: z.string().trim().min(1, "Enter a name"),
  category: z.string().trim().min(1, "Choose a category"),
  amount: positive(undefined, "Enter an amount greater than zero"),
  date: z.string().min(1, "Enter a date"),
  recurring: z.boolean().optional(),
});

const loanSchema = z.object({
  name: z.string().trim().min(1, "Enter a name"),
  type: z.string().trim().min(1, "Choose a loan type"),
  outstanding: positive(undefined, "Enter the outstanding amount"),
  interestRate: nonNegative("Enter an interest rate"),
  emi: positive(undefined, "Enter an EMI greater than zero"),
  remainingTenure: z.number().int().min(1, "Enter remaining tenure in months").max(600, "Tenure cannot exceed 600 months"),
  emiDay: z.number().int().min(1, "EMI day must be 1–31").max(31, "EMI day must be 1–31"),
  prepaymentAllowed: z.boolean().optional(),
});

const investmentSchema = z
  .object({
    name: z.string().trim().min(1, "Enter a name"),
    type: z.string().trim().min(1, "Choose an investment type"),
    currentValue: nonNegative("Current value cannot be negative"),
    monthlySip: nonNegative("SIP cannot be negative").optional(),
    expectedReturn: nonNegative("Expected return cannot be negative").optional(),
    horizon: nonNegative("Horizon cannot be negative").optional(),
  })
  .refine((value) => value.currentValue > 0 || (value.monthlySip ?? 0) > 0, {
    message: "Enter a current value or monthly SIP greater than zero",
    path: ["currentValue"],
  });

const insuranceSchema = z.object({
  name: z.string().trim().min(1, "Enter a name"),
  type: z.string().trim().min(1, "Choose an insurance type"),
  coverage: positive(undefined, "Enter coverage greater than zero"),
  annualPremium: nonNegative("Enter a valid annual premium"),
  expiryDate: z.string().min(1, "Enter an expiry date"),
});

const goalSchema = z.object({
  name: z.string().trim().min(1, "Enter a name"),
  type: z.string().trim().min(1, "Choose a goal type"),
  targetAmount: positive(undefined, "Set a target amount greater than zero"),
  currentSaved: nonNegative("Already saved cannot be negative").optional(),
  targetDate: z.string().min(1, "Enter a target date"),
  priority: z.string().optional(),
});

const ENTITY_SCHEMAS = {
  incomes: incomeSchema,
  expenses: expenseSchema,
  loans: loanSchema,
  investments: investmentSchema,
  insurances: insuranceSchema,
  goals: goalSchema,
} as const;

export type EntityDraftKey = keyof typeof ENTITY_SCHEMAS;

function numeric(value: unknown): number {
  const n = typeof value === "number" ? value : Number(value);
  return Number.isFinite(n) ? n : 0;
}

export function isEntityDraftEmpty(key: EntityDraftKey, values: Record<string, unknown>): boolean {
  switch (key) {
    case "incomes":
      return !String(values.type ?? "").trim() && !String(values.name ?? "").trim() && !(numeric(values.monthlyAmount) > 0);
    case "expenses":
      return !String(values.category ?? "").trim() && !(numeric(values.amount) > 0) && !String(values.name ?? "").trim();
    case "loans":
      return !String(values.type ?? "").trim() && !String(values.name ?? "").trim() && !(numeric(values.outstanding) > 0 || numeric(values.emi) > 0);
    case "investments":
      return !String(values.type ?? "").trim() && !String(values.name ?? "").trim() && !(numeric(values.currentValue) > 0 || numeric(values.monthlySip) > 0);
    case "insurances":
      return !String(values.type ?? "").trim() && !String(values.name ?? "").trim() && !(numeric(values.coverage) > 0 || numeric(values.annualPremium) > 0);
    case "goals":
      return !String(values.type ?? "").trim() && !String(values.name ?? "").trim() && !(numeric(values.targetAmount) > 0);
    default:
      return true;
  }
}

export function validateEntityDraft(
  key: EntityDraftKey,
  values: Record<string, unknown>,
): { status: EntityDraftStatus; errors: FieldErrors } {
  if (isEntityDraftEmpty(key, values)) {
    return { status: "empty", errors: {} };
  }
  const parsed = ENTITY_SCHEMAS[key].safeParse(values);
  if (parsed.success) return { status: "complete", errors: {} };
  return { status: "incomplete", errors: firstIssue(parsed.error) };
}

export function toSavedFamilyMembers(members: FamilyMemberDraft[]): FamilyMember[] {
  return members.map((member) => ({
    name: member.name.trim(),
    relationship: member.relationship as FamilyMember["relationship"],
    dob: member.dob,
    gender: member.gender as FamilyMember["gender"],
    occupation: member.occupation.trim(),
  }));
}

export function familyMemberError(errors: FieldErrors, index: number, field: string): string | undefined {
  return errors[`familyMembers.${index}.${field}`] ?? (index === 0 ? errors[field] : undefined);
}
