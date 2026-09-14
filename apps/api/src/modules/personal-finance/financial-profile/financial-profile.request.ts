import { z } from "zod";

export const employmentTypes = ["Salaried", "Business Owner", "Freelancer", "Retired"] as const;
export const familyRelationships = ["Spouse", "Child", "Parent", "Sibling", "Other"] as const;
export const familyGenders = ["female", "male", "other"] as const;

function ageFromIsoDate(dob: string): number | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(dob);
  if (!match) return null;
  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const birth = new Date(year, month - 1, day);
  if (
    Number.isNaN(birth.getTime()) ||
    birth.getFullYear() !== year ||
    birth.getMonth() !== month - 1 ||
    birth.getDate() !== day
  ) {
    return null;
  }
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  birth.setHours(0, 0, 0, 0);
  if (birth > today) return -1;
  let age = today.getFullYear() - birth.getFullYear();
  const monthDelta = today.getMonth() - birth.getMonth();
  if (monthDelta < 0 || (monthDelta === 0 && today.getDate() < birth.getDate())) {
    age -= 1;
  }
  return age;
}

export const familyMemberSchema = z
  .object({
    name: z.string().trim().min(1).max(80),
    relationship: z.enum(familyRelationships),
    dob: z.iso.date(),
    gender: z.enum(familyGenders),
    occupation: z.string().trim().min(1).max(80),
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

export const upsertFinancialProfileBodySchema = z
  .object({
    retirementAge: z.number().int().min(30).max(90),
    dependents: z.number().int().min(0).max(20),
    inflationRate: z.number().min(0).max(30),
    employmentType: z.enum(employmentTypes),
    currency: z.string().trim().min(1).max(8),
    familyMembers: z.array(familyMemberSchema).max(20).default([]),
  })
  .superRefine((value, ctx) => {
    if (value.familyMembers.length !== value.dependents) {
      ctx.addIssue({
        code: "custom",
        message: "Family member details must match the dependents count",
        path: ["familyMembers"],
      });
    }
  });

export type FamilyMemberBody = z.infer<typeof familyMemberSchema>;
export type UpsertFinancialProfileBody = z.infer<typeof upsertFinancialProfileBodySchema>;
