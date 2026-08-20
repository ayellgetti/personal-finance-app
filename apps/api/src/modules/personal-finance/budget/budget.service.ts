import { HttpError } from "../../../lib/http-error.js";
import { budgetModel, type BudgetModel } from "../../../models/index.js";
import type {
  CreateBudgetBody,
  ListBudgetsQuery,
  RemoveBudgetBody,
  UpdateBudgetBody,
} from "./budget.request.js";

export class BudgetService {
  constructor(private readonly model: BudgetModel = budgetModel) {}

  list(userId: string, query: ListBudgetsQuery) {
    return this.model.paginate(
      {
        userId,
        isActive: 1,
        ...(query.type ? { type: query.type } : {}),
        ...(query.category ? { category: query.category } : {}),
      },
      query.page ?? 1,
      query.limit ?? 25,
      { orderBy: { createdAt: "desc" } },
    );
  }

  async getById(userId: string, id: string) {
    return this.requireOwned(userId, id);
  }

  create(userId: string, input: CreateBudgetBody) {
    return this.model.create({
      userId,
      type: input.type,
      category: input.category,
      subcategory: input.subcategory,
      title: input.title,
      description: input.description,
      amount: input.amount,
      monthDay: input.monthDay,
      weekDay: input.weekDay,
      repeatCount: input.repeatCount,
    });
  }

  async update(userId: string, id: string, input: UpdateBudgetBody) {
    await this.requireOwned(userId, id);
    return this.model.update({ id }, input);
  }

  async remove(userId: string, input: RemoveBudgetBody) {
    await this.requireOwned(userId, input.id);
    await this.model.update(
      { id: input.id },
      { isActive: 0, deletedAt: new Date() },
    );
    return { id: input.id, removed: true };
  }

  private async requireOwned(userId: string, id: string) {
    const budget = await this.model.readOne({ id });
    if (!budget || budget.userId !== userId || budget.isActive !== 1) {
      throw new HttpError(404, "Budget not found");
    }
    return budget;
  }
}

export const budgetService = new BudgetService();
