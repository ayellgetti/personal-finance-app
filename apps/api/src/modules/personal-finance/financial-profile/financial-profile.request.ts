import { z } from "zod";

export const employmentTypes = ["Salaried", "Business Owner", "Freelancer", "Retired"] as const;

export const upsertFinancialProfileBodySchema = z.object({
  retirementAge: z.number().int().min(30).max(90),
  dependents: z.number().int().min(0).max(20),
  inflationRate: z.number().min(0).max(30),
  employmentType: z.enum(employmentTypes),
  currency: z.string().trim().min(1).max(8),
});

export type UpsertFinancialProfileBody = z.infer<typeof upsertFinancialProfileBodySchema>;
