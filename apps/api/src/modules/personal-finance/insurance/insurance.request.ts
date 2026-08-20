import { z } from "zod";

export const insuranceIdParamsSchema = z.object({
  id: z.string().uuid(),
});

export const listInsurancesQuerySchema = z.object({
  page: z.coerce.number().int().min(1).optional(),
  limit: z.coerce.number().int().min(1).max(100).optional(),
});

export const createInsuranceBodySchema = z.object({
  title: z.string().trim().min(1).max(120).nullable().optional(),
  type: z.string().trim().min(1).max(80),
  coverageAmount: z.number().nonnegative(),
  annualPremium: z.number().nonnegative(),
  expiryDate: z.coerce.date(),
});

export const updateInsuranceBodySchema = createInsuranceBodySchema
  .partial()
  .refine((value) => Object.keys(value).length > 0, {
    message: "At least one field is required",
  });

export const removeInsuranceBodySchema = z.object({
  id: z.string().uuid(),
});

export type InsuranceIdParams = z.infer<typeof insuranceIdParamsSchema>;
export type ListInsurancesQuery = z.infer<typeof listInsurancesQuerySchema>;
export type CreateInsuranceBody = z.infer<typeof createInsuranceBodySchema>;
export type UpdateInsuranceBody = z.infer<typeof updateInsuranceBodySchema>;
export type RemoveInsuranceBody = z.infer<typeof removeInsuranceBodySchema>;
