import { financialProfileModel, type FinancialProfileModel } from "../../../models/index";
import type { UpsertFinancialProfileBody } from "./financial-profile.request";

const DEFAULTS = {
  retirementAge: 60,
  dependents: 0,
  inflationRate: 6,
  employmentType: "Salaried",
  currency: "₹",
} as const;

export class FinancialProfileService {
  constructor(private readonly model: FinancialProfileModel = financialProfileModel) {}

  async getByUserId(userId: string) {
    const existing = await this.model.readOne({ userId });
    if (existing) return existing;
    return this.model.create({ userId, ...DEFAULTS });
  }

  async upsert(userId: string, input: UpsertFinancialProfileBody) {
    const existing = await this.model.readOne({ userId });
    if (existing) {
      return this.model.update({ id: existing.id }, { ...input, isActive: 1 });
    }
    return this.model.create({ userId, ...input });
  }
}

export const financialProfileService = new FinancialProfileService();
