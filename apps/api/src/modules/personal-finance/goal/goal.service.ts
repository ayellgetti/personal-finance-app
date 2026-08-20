import { HttpError } from "../../../lib/http-error.js";
import { goalModel, type GoalModel } from "../../../models/index.js";
import type {
  CreateGoalBody,
  ListGoalsQuery,
  RemoveGoalBody,
  UpdateGoalBody,
} from "./goal.request.js";

export class GoalService {
  constructor(private readonly model: GoalModel = goalModel) {}

  list(userId: string, query: ListGoalsQuery) {
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

  create(userId: string, input: CreateGoalBody) {
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
    await this.requireOwned(userId, id);
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
    await this.requireOwned(userId, input.id);
    await this.model.update(
      { id: input.id },
      { isActive: 0, deletedAt: new Date() },
    );
    return { id: input.id, removed: true };
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
