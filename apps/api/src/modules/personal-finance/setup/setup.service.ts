import { prisma } from "../../../lib/prisma.js";
import type { SetupBody } from "./setup.request.js";

export class SetupService {
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

      await tx.user.update({
        where: { id: userId },
        data: { quickStep: 1 },
      });

      return {
        financialProfile,
        incomes,
        expenses,
        loans,
        investments,
        insurances,
      };
    });
  }
}

export const setupService = new SetupService();
