import { z } from "zod";

export const budgetIdParamsSchema = z.object({
  id: z.string().uuid(),
});

export const listBudgetsQuerySchema = z.object({
  page: z.coerce.number().int().min(1).optional(),
  limit: z.coerce.number().int().min(1).max(100).optional(),
  type: z.string().trim().min(1).max(40).optional(),
  category: z.string().trim().min(1).max(80).optional(),
});

export const createBudgetBodySchema = z.object({
  type: z.string().trim().min(1).max(40),
  category: z.string().trim().min(1).max(80),
  subcategory: z.string().trim().min(1).max(80),
  title: z.string().trim().min(1).max(120),
  description: z.string().trim().max(500).nullable().optional(),
  amount: z.number().nonnegative(),
  monthDay: z.number().int().min(1).max(31).nullable().optional(),
  weekDay: z.number().int().min(1).max(7).nullable().optional(),
  repeatCount: z.number().int().min(1).max(31).nullable().optional(),
});

export const updateBudgetBodySchema = createBudgetBodySchema
  .partial()
  .refine((value) => Object.keys(value).length > 0, {
    message: "At least one field is required",
  });

export const removeBudgetBodySchema = z.object({
  id: z.string().uuid(),
});

export type BudgetIdParams = z.infer<typeof budgetIdParamsSchema>;
export type ListBudgetsQuery = z.infer<typeof listBudgetsQuerySchema>;
export type CreateBudgetBody = z.infer<typeof createBudgetBodySchema>;
export type UpdateBudgetBody = z.infer<typeof updateBudgetBodySchema>;
export type RemoveBudgetBody = z.infer<typeof removeBudgetBodySchema>;
