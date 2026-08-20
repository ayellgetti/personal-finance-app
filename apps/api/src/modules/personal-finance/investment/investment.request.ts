import { z } from "zod";

export const investmentIdParamsSchema = z.object({
  id: z.string().uuid(),
});

export const listInvestmentsQuerySchema = z.object({
  page: z.coerce.number().int().min(1).optional(),
  limit: z.coerce.number().int().min(1).max(100).optional(),
  subcategory: z.string().trim().min(1).max(80).optional(),
});

export const createInvestmentBodySchema = z.object({
  category: z.string().trim().min(1).max(80).default("investment"),
  subcategory: z.string().trim().min(1).max(80),
  title: z.string().trim().min(1).max(120).nullable().optional(),
  accumulatedAmount: z.number().nonnegative(),
  roi: z.number().min(0).max(100),
  remainingMonths: z.number().int().min(0).max(600),
  investmentAmount: z.number().nonnegative(),
  monthDay: z.number().int().min(1).max(31),
});

export const updateInvestmentBodySchema = createInvestmentBodySchema
  .partial()
  .refine((value) => Object.keys(value).length > 0, {
    message: "At least one field is required",
  });

export const removeInvestmentBodySchema = z.object({
  id: z.string().uuid(),
});

export type InvestmentIdParams = z.infer<typeof investmentIdParamsSchema>;
export type ListInvestmentsQuery = z.infer<typeof listInvestmentsQuerySchema>;
export type CreateInvestmentBody = z.infer<typeof createInvestmentBodySchema>;
export type UpdateInvestmentBody = z.infer<typeof updateInvestmentBodySchema>;
export type RemoveInvestmentBody = z.infer<typeof removeInvestmentBodySchema>;
