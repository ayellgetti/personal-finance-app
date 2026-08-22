import { z } from "zod";

export const taxIdParamsSchema = z.object({
  id: z.string().uuid(),
});

export const listTaxScenariosQuerySchema = z.object({
  page: z.coerce.number().int().min(1).optional(),
  limit: z.coerce.number().int().min(1).max(100).optional(),
  countryCode: z.string().trim().min(2).max(8).optional(),
});

const money = z.number().nonnegative().max(1_000_000_000);

export const taxPlanInputSchema = z.object({
  countryCode: z.string().trim().min(2).max(8),
  regimeCode: z.string().trim().min(1).max(80),
  grossSalary: money,
  otherIncome: money.optional().default(0),
  section80C: money.optional(),
  section80D: money.optional(),
  hraExemption: money.optional(),
  homeLoanInterest: money.optional(),
  nps80Ccd: money.optional(),
  otherDeductions: money.optional(),
});

export const createTaxScenarioBodySchema = taxPlanInputSchema.extend({
  title: z.string().trim().min(1).max(120).optional(),
});

export const updateTaxScenarioBodySchema = createTaxScenarioBodySchema
  .partial()
  .refine((value) => Object.keys(value).length > 0, {
    message: "At least one field is required",
  });

export const removeTaxScenarioBodySchema = z.object({
  id: z.string().uuid(),
});

export type TaxIdParams = z.infer<typeof taxIdParamsSchema>;
export type ListTaxScenariosQuery = z.infer<typeof listTaxScenariosQuerySchema>;
export type TaxPlanInputBody = z.infer<typeof taxPlanInputSchema>;
export type CreateTaxScenarioBody = z.infer<typeof createTaxScenarioBodySchema>;
export type UpdateTaxScenarioBody = z.infer<typeof updateTaxScenarioBodySchema>;
export type RemoveTaxScenarioBody = z.infer<typeof removeTaxScenarioBodySchema>;
