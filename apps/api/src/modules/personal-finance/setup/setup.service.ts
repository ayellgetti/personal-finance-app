import { prisma } from "../../../utils/prisma.util";
import { HttpError } from "../../../utils/http-error.util";
import { goalModel } from "../../../models/index";
import { userService } from "../../shared/user/user.service";
import {
  EMERGENCY_FUND_CATEGORY,
  EMERGENCY_FUND_SUBCATEGORY,
  EMERGENCY_FUND_TITLE,
  FIRE_GOAL_CATEGORY,
  FIRE_GOAL_SUBCATEGORIES,
  emergencyFundTargetMonths,
} from "../goal/goal.constants";
import type { SetupBody } from "./setup.request";

export function assertRequiredSetupGoals(
  emergencyFund: { targetAmount: number } | null,
  fireGoal: { targetAmount: number } | null,
) {
  if (!emergencyFund || emergencyFund.targetAmount <= 0) {
    throw new HttpError(
      422,
      "A funded emergency goal with a target amount is required",
    );
  }
  if (!fireGoal || fireGoal.targetAmount <= 0) {
    throw new HttpError(
      422,
      "Choose Lean FIRE, Fat FIRE, or Coast FIRE and set a target amount",
    );
  }
}

export class SetupService {
  async completeQuickStep(userId: string) {
    const [emergencyFund, fireGoal] = await Promise.all([
      goalModel.findOne({
        userId,
        isActive: 1,
        category: EMERGENCY_FUND_CATEGORY,
      }),
      goalModel.findOne({
        userId,
        isActive: 1,
        category: FIRE_GOAL_CATEGORY,
        subcategory: { in: [...FIRE_GOAL_SUBCATEGORIES] },
      }),
    ]);

    assertRequiredSetupGoals(emergencyFund, fireGoal);

    return userService.updateMe(userId, { quickStep: 1 });
  }

  complete(userId: string, input: SetupBody) {
    return prisma.$transaction(async (tx) => {
      const financialProfile = await tx.financialProfile.upsert({
        where: { userId },
        update: { ...input.profile, isActive: 1 },
        create: { userId, ...input.profile },
      });

      const incomes = await Promise.all(
        input.incomes.map((row) =>
          tx.budget.create({
            data: {
              userId,
              type: "income",
              category: row.category ?? "income",
              subcategory: row.subcategory,
              title: row.title,
              description: row.description,
              amount: row.amount,
              monthDay: row.monthDay,
              weekDay: row.weekDay,
              repeatCount: row.repeatCount,
            },
          }),
        ),
      );

      const expenses = await Promise.all(
        input.expenses.map((row) =>
          tx.budget.create({
            data: {
              userId,
              type: "expense",
              category: row.category ?? "expense",
              subcategory: row.subcategory,
              title: row.title,
              description: row.description,
              amount: row.amount,
              monthDay: row.monthDay,
              weekDay: row.weekDay,
              repeatCount: row.repeatCount,
            },
          }),
        ),
      );

      const loans = await Promise.all(
        input.loans.map((row) =>
          tx.loan.create({
            data: {
              userId,
              title: row.title,
              type: row.type,
              principalPendingAmount: row.principalPendingAmount,
              roi: row.roi,
              remainingMonths: row.remainingMonths,
              emiAmount: row.emiAmount,
              emiDay: row.emiDay,
            },
          }),
        ),
      );

      const investments = await Promise.all(
        input.investments.map((row) =>
          tx.investment.create({
            data: {
              userId,
              category: row.category,
              subcategory: row.subcategory.toLowerCase(),
              title: row.title,
              accumulatedAmount: row.accumulatedAmount,
              roi: row.roi,
              remainingMonths: row.remainingMonths,
              investmentAmount: row.investmentAmount,
              monthDay: row.monthDay,
            },
          }),
        ),
      );

      const insurances = await Promise.all(
        input.insurances.map((row) =>
          tx.insurance.create({
            data: {
              userId,
              title: row.title,
              type: row.type,
              coverageAmount: row.coverageAmount,
              annualPremium: row.annualPremium,
              expiryDate: row.expiryDate,
            },
          }),
        ),
      );

      const existingEmergencyFund = await tx.goal.findFirst({
        where: { userId, isActive: 1, category: EMERGENCY_FUND_CATEGORY },
      });
      const remainingYears = 1;
      const monthlyExpenses = input.expenses.reduce((sum, row) => sum + row.amount, 0);
      const emergencyFund =
        existingEmergencyFund ??
        (await tx.goal.create({
          data: {
            userId,
            category: EMERGENCY_FUND_CATEGORY,
            subcategory: EMERGENCY_FUND_SUBCATEGORY,
            title: EMERGENCY_FUND_TITLE,
            targetAmount:
              monthlyExpenses > 0
                ? monthlyExpenses * emergencyFundTargetMonths(input.profile.employmentType)
                : 0,
            currentAmount: 0,
            remainingYears,
            targetYear: new Date().getFullYear() + remainingYears,
          },
        }));

      return {
        financialProfile,
        incomes,
        expenses,
        loans,
        investments,
        insurances,
        emergencyFund,
      };
    });
  }
}

export const setupService = new SetupService();
