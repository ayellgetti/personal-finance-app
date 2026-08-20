import { z } from "zod";

export const goalIdParamsSchema = z.object({
  id: z.string().uuid(),
});

export const listGoalsQuerySchema = z.object({
  page: z.coerce.number().int().min(1).optional(),
  limit: z.coerce.number().int().min(1).max(100).optional(),
  category: z.string().trim().min(1).max(80).optional(),
  subcategory: z.string().trim().min(1).max(80).optional(),
});

export const createGoalBodySchema = z.object({
  category: z.string().trim().min(1).max(80),
  subcategory: z.string().trim().min(1).max(80),
  title: z.string().trim().min(1).max(160),
  description: z.string().trim().max(500).nullable().optional(),
  targetAmount: z.number().nonnegative(),
  currentAmount: z.number().nonnegative().optional(),
  remainingYears: z.number().int().min(0).max(80),
  targetYear: z.number().int().min(1900).max(2200).optional(),
  bornYear: z.number().int().min(1900).max(2200).nullable().optional(),
  currentAge: z.number().int().min(0).max(120).nullable().optional(),
  targetAge: z.number().int().min(0).max(120).nullable().optional(),
});

export const updateGoalBodySchema = createGoalBodySchema.partial().refine((value) => Object.keys(value).length > 0, {
  message: "At least one field is required",
});

export const removeGoalBodySchema = z.object({
  id: z.string().uuid(),
});

export type GoalIdParams = z.infer<typeof goalIdParamsSchema>;
export type ListGoalsQuery = z.infer<typeof listGoalsQuerySchema>;
export type CreateGoalBody = z.infer<typeof createGoalBodySchema>;
export type UpdateGoalBody = z.infer<typeof updateGoalBodySchema>;
export type RemoveGoalBody = z.infer<typeof removeGoalBodySchema>;
