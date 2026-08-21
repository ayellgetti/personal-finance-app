import { HttpError } from "../../../utils/http-error.util";
import { goalModel, type GoalModel } from "../../../models/index";
import type {
  CreateGoalBody,
  ListGoalsQuery,
  RemoveGoalBody,
  UpdateGoalBody,
} from "./goal.request";
import {
  EMERGENCY_FUND_CATEGORY,
  EMERGENCY_FUND_SUBCATEGORY,
  EMERGENCY_FUND_TITLE,
  FIRE_GOAL_CATEGORY,
  FIRE_GOAL_SUBCATEGORIES,
  emergencyFundTargetMonths,
  isEmergencyFundGoal,
  isFireGoal,
} from "./goal.constants";

export class GoalService {
  constructor(private readonly model: GoalModel = goalModel) {}

  async list(userId: string, query: ListGoalsQuery) {
    await this.ensureEmergencyFund(userId);
    return this.model.paginate(
      {
        userId,
        isActive: 1,
        ...(query.category ? { category: query.category } : {}),
        ...(query.subcategory ? { subcategory: query.subcategory } : {}),
      },
      query.page ?? 1,
      query.limit ?? 25,
      { orderBy: { targetYear: "asc" } },
    );
  }

  async getById(userId: string, id: string) {
    return this.requireOwned(userId, id);
  }

  async create(userId: string, input: CreateGoalBody) {
    if (isEmergencyFundGoal(input)) {
      const existing = await this.findEmergencyFund(userId);
      if (existing) {
        throw new HttpError(409, "Emergency fund goal already exists");
      }
    }
    if (isFireGoal(input) && (await this.findFireGoal(userId))) {
      throw new HttpError(
        409,
        "A FIRE goal already exists; update it to change the FIRE type",
      );
    }

    return this.model.create({
      userId,
      category: input.category,
      subcategory: input.subcategory.toLowerCase(),
      title: input.title,
      description: input.description,
      targetAmount: input.targetAmount,
      currentAmount: input.currentAmount ?? 0,
      remainingYears: input.remainingYears,
      targetYear: input.targetYear ?? new Date().getFullYear() + input.remainingYears,
      bornYear: input.bornYear,
      currentAge: input.currentAge,
      targetAge: input.targetAge,
    });
  }

  async update(userId: string, id: string, input: UpdateGoalBody) {
    const goal = await this.requireOwned(userId, id);
    if (isEmergencyFundGoal(goal) && this.changesEmergencyFundIdentity(input)) {
      throw new HttpError(400, "Emergency fund category cannot be changed");
    }
    return this.model.update(
      { id },
      {
        ...input,
        ...(input.subcategory
          ? { subcategory: input.subcategory.toLowerCase() }
          : {}),
      },
    );
  }

  async remove(userId: string, input: RemoveGoalBody) {
    const goal = await this.requireOwned(userId, input.id);
    if (isEmergencyFundGoal(goal)) {
      throw new HttpError(400, "Emergency fund goal is required and cannot be removed");
    }
    await this.model.update(
      { id: input.id },
      { isActive: 0, deletedAt: new Date() },
    );
    return { id: input.id, removed: true };
  }

  async ensureEmergencyFund(
    userId: string,
    options: { employmentType?: string; monthlyExpenses?: number } = {},
  ) {
    const existing = await this.findEmergencyFund(userId);
    if (existing) {
      return existing;
    }

    const remainingYears = 1;
    const monthlyExpenses = options.monthlyExpenses ?? 0;
    const targetAmount =
      monthlyExpenses > 0
        ? monthlyExpenses * emergencyFundTargetMonths(options.employmentType)
        : 0;

    return this.model.create({
      userId,
      category: EMERGENCY_FUND_CATEGORY,
      subcategory: EMERGENCY_FUND_SUBCATEGORY,
      title: EMERGENCY_FUND_TITLE,
      targetAmount,
      currentAmount: 0,
      remainingYears,
      targetYear: new Date().getFullYear() + remainingYears,
    });
  }

  private findEmergencyFund(userId: string) {
    return this.model.findOne({
      userId,
      isActive: 1,
      category: EMERGENCY_FUND_CATEGORY,
    });
  }

  private findFireGoal(userId: string) {
    return this.model.findOne({
      userId,
      isActive: 1,
      category: FIRE_GOAL_CATEGORY,
      subcategory: { in: [...FIRE_GOAL_SUBCATEGORIES] },
    });
  }

  private changesEmergencyFundIdentity(input: UpdateGoalBody): boolean {
    return Boolean(
      (input.category && input.category !== EMERGENCY_FUND_CATEGORY) ||
        (input.subcategory &&
          input.subcategory.toLowerCase() !== EMERGENCY_FUND_SUBCATEGORY),
    );
  }

  private async requireOwned(userId: string, id: string) {
    const goal = await this.model.readOne({ id });
    if (!goal || goal.userId !== userId || goal.isActive !== 1) {
      throw new HttpError(404, "Goal not found");
    }
    return goal;
  }
}

export const goalService = new GoalService();
