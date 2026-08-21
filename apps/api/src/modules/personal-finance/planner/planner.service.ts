import {
  budgetModel,
  goalModel,
  investmentModel,
  loanModel,
} from "../../../models/index";
import { goalService } from "../goal/goal.service";
import { buildPlannerReport } from "./planner.engine";

export class PlannerService {
  async report(userId: string) {
    await goalService.ensureEmergencyFund(userId);
    const [budgets, loans, investments, goals] = await Promise.all([
      budgetModel.read({ userId, isActive: 1 }),
      loanModel.read({ userId, isActive: 1 }),
      investmentModel.read({ userId, isActive: 1 }),
      goalModel.read({ userId, isActive: 1 }),
    ]);

    return buildPlannerReport({
      budgets: budgets.map((budget) => ({
        id: budget.id,
        type: budget.type,
        subcategory: budget.subcategory,
        title: budget.title,
        amount: budget.amount,
        monthDay: budget.monthDay,
        weekDay: budget.weekDay,
        repeatCount: budget.repeatCount,
      })),
      loans: loans.map((loan) => ({
        id: loan.id,
        title: loan.title,
        type: loan.type,
        principalPendingAmount: loan.principalPendingAmount,
        roi: loan.roi,
        remainingMonths: loan.remainingMonths,
        emiAmount: loan.emiAmount,
        emiDay: loan.emiDay,
      })),
      investments: investments.map((item) => ({
        id: item.id,
        subcategory: item.subcategory,
        title: item.title,
        accumulatedAmount: item.accumulatedAmount,
        roi: item.roi,
        remainingMonths: item.remainingMonths,
        investmentAmount: item.investmentAmount,
        monthDay: item.monthDay,
        onHold: item.onHold === 1,
      })),
      goals: goals.map((goal) => ({
        id: goal.id,
        category: goal.category,
        subcategory: goal.subcategory,
        title: goal.title,
        targetAmount: goal.targetAmount,
        currentAmount: goal.currentAmount,
        remainingYears: goal.remainingYears,
        targetYear: goal.targetYear,
      })),
    });
  }
}

export const plannerService = new PlannerService();
