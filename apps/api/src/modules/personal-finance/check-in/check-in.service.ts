import { checkInModel, type CheckInModel } from "../../../models/index";
import type { ListCheckInsQuery, UpsertCheckInBody } from "./check-in.request";

export class CheckInService {
  constructor(private readonly model: CheckInModel = checkInModel) {}

  /** Newest month first. Bounded by `limit` (default 24 months). */
  async list(userId: string, query: ListCheckInsQuery) {
    const items = await this.model.read(
      { userId, isActive: 1 },
      { orderBy: { month: "desc" }, take: query.limit ?? 24 },
    );
    return { items };
  }

  /** One check-in per month: saving again for the same month replaces it. */
  upsert(userId: string, input: UpsertCheckInBody) {
    const values = {
      netWorth: input.netWorth,
      assets: input.assets,
      liabilities: input.liabilities,
      monthlyIncome: input.monthlyIncome,
      monthlyExpense: input.monthlyExpense,
      healthScore: input.healthScore,
    };
    return this.model.upsert(
      { userId_month: { userId, month: input.month } },
      { userId, month: input.month, createdBy: userId, ...values },
      { ...values, updatedBy: userId, isActive: 1, deletedAt: null, deletedBy: null },
    );
  }
}

export const checkInService = new CheckInService();
