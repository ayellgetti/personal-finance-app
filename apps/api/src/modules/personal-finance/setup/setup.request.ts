import { z } from "zod";
import { createBudgetBodySchema } from "../budget/budget.request.js";
import { upsertFinancialProfileBodySchema } from "../financial-profile/financial-profile.request.js";
import { createInsuranceBodySchema } from "../insurance/insurance.request.js";
import { createInvestmentBodySchema } from "../investment/investment.request.js";
import { createLoanBodySchema } from "../loan/loan.request.js";

const setupIncomeBodySchema = createBudgetBodySchema
  .omit({ type: true, category: true })
  .extend({
    type: z.literal("income").optional(),
    category: z.string().trim().min(1).max(80).optional(),
  });

const setupExpenseBodySchema = createBudgetBodySchema
  .omit({ type: true, category: true })
  .extend({
    type: z.literal("expense").optional(),
    category: z.string().trim().min(1).max(80).optional(),
  });

export const setupBodySchema = z.object({
  profile: upsertFinancialProfileBodySchema,
  incomes: z.array(setupIncomeBodySchema).default([]),
  expenses: z.array(setupExpenseBodySchema).default([]),
  loans: z.array(createLoanBodySchema).default([]),
  investments: z.array(createInvestmentBodySchema).default([]),
  insurances: z.array(createInsuranceBodySchema).default([]),
});

export type SetupBody = z.infer<typeof setupBodySchema>;
