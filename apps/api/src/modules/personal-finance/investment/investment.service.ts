import { HttpError } from "../../../lib/http-error.js";
import { investmentModel, type InvestmentModel } from "../../../models/index.js";
import type {
  CreateInvestmentBody,
  ListInvestmentsQuery,
  RemoveInvestmentBody,
  UpdateInvestmentBody,
} from "./investment.request.js";

export class InvestmentService {
  constructor(private readonly model: InvestmentModel = investmentModel) {}

  list(userId: string, query: ListInvestmentsQuery) {
    return this.model.paginate(
      {
        userId,
        isActive: 1,
        ...(query.subcategory ? { subcategory: query.subcategory } : {}),
      },
      query.page ?? 1,
      query.limit ?? 25,
      { orderBy: { createdAt: "desc" } },
    );
  }

  async getById(userId: string, id: string) {
    return this.requireOwned(userId, id);
  }

  create(userId: string, input: CreateInvestmentBody) {
    return this.model.create({
      userId,
      category: input.category,
      subcategory: input.subcategory.toLowerCase(),
      title: input.title,
      accumulatedAmount: input.accumulatedAmount,
      roi: input.roi,
      remainingMonths: input.remainingMonths,
      investmentAmount: input.investmentAmount,
      monthDay: input.monthDay,
    });
  }

  async update(userId: string, id: string, input: UpdateInvestmentBody) {
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

  async remove(userId: string, input: RemoveInvestmentBody) {
    await this.requireOwned(userId, input.id);
    await this.model.update(
      { id: input.id },
      { isActive: 0, deletedAt: new Date() },
    );
    return { id: input.id, removed: true };
  }

  private async requireOwned(userId: string, id: string) {
    const investment = await this.model.readOne({ id });
    if (!investment || investment.userId !== userId || investment.isActive !== 1) {
      throw new HttpError(404, "Investment not found");
    }
    return investment;
  }
}

export const investmentService = new InvestmentService();
