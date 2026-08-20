import { z } from "zod";

export const loanIdParamsSchema = z.object({
  id: z.string().uuid(),
});

export const listLoansQuerySchema = z.object({
  page: z.coerce.number().int().min(1).optional(),
  limit: z.coerce.number().int().min(1).max(100).optional(),
});

export const createLoanBodySchema = z.object({
  title: z.string().trim().min(1).max(120).nullable().optional(),
  type: z.string().trim().min(1).max(80),
  principalPendingAmount: z.number().nonnegative(),
  roi: z.number().min(0).max(100),
  remainingMonths: z.number().int().min(0).max(600),
  emiAmount: z.number().nonnegative(),
  emiDay: z.number().int().min(1).max(31),
});

export const updateLoanBodySchema = createLoanBodySchema.partial().refine((value) => Object.keys(value).length > 0, {
  message: "At least one field is required",
});

export const removeLoanBodySchema = z.object({
  id: z.string().uuid(),
});

export type LoanIdParams = z.infer<typeof loanIdParamsSchema>;
export type ListLoansQuery = z.infer<typeof listLoansQuerySchema>;
export type CreateLoanBody = z.infer<typeof createLoanBodySchema>;
export type UpdateLoanBody = z.infer<typeof updateLoanBodySchema>;
export type RemoveLoanBody = z.infer<typeof removeLoanBodySchema>;
