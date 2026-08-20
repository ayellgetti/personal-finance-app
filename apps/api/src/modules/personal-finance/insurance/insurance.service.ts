import { HttpError } from "../../../lib/http-error.js";
import { insuranceModel, type InsuranceModel } from "../../../models/index.js";
import type {
  CreateInsuranceBody,
  ListInsurancesQuery,
  RemoveInsuranceBody,
  UpdateInsuranceBody,
} from "./insurance.request.js";

export class InsuranceService {
  constructor(private readonly model: InsuranceModel = insuranceModel) {}

  list(userId: string, query: ListInsurancesQuery) {
    return this.model.paginate(
      { userId, isActive: 1 },
      query.page ?? 1,
      query.limit ?? 25,
      { orderBy: { createdAt: "desc" } },
    );
  }

  async getById(userId: string, id: string) {
    return this.requireOwned(userId, id);
  }

  create(userId: string, input: CreateInsuranceBody) {
    return this.model.create({
      userId,
      title: input.title,
      type: input.type,
      coverageAmount: input.coverageAmount,
      annualPremium: input.annualPremium,
      expiryDate: input.expiryDate,
    });
  }

  async update(userId: string, id: string, input: UpdateInsuranceBody) {
    await this.requireOwned(userId, id);
    return this.model.update({ id }, input);
  }

  async remove(userId: string, input: RemoveInsuranceBody) {
    await this.requireOwned(userId, input.id);
    await this.model.update(
      { id: input.id },
      { isActive: 0, deletedAt: new Date() },
    );
    return { id: input.id, removed: true };
  }

  private async requireOwned(userId: string, id: string) {
    const insurance = await this.model.readOne({ id });
    if (!insurance || insurance.userId !== userId || insurance.isActive !== 1) {
      throw new HttpError(404, "Insurance not found");
    }
    return insurance;
  }
}

export const insuranceService = new InsuranceService();
