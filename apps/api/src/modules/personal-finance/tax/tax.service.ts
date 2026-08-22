import type { Prisma } from "@prisma/client";
import { HttpError } from "../../../utils/http-error.util";
import {
  taxScenarioModel,
  type TaxScenarioModel,
} from "../../../models/index";
import { findTaxRegime, listTaxCatalog } from "./tax.catalog";
import { computeTaxPlan } from "./tax.engine";
import type {
  CreateTaxScenarioBody,
  ListTaxScenariosQuery,
  RemoveTaxScenarioBody,
  TaxPlanInputBody,
  UpdateTaxScenarioBody,
} from "./tax.request";

export class TaxService {
  constructor(private readonly model: TaxScenarioModel = taxScenarioModel) {}

  catalog() {
    return { countries: listTaxCatalog() };
  }

  preview(input: TaxPlanInputBody) {
    this.requireRegime(input.countryCode, input.regimeCode);
    return computeTaxPlan(input);
  }

  list(userId: string, query: ListTaxScenariosQuery) {
    return this.model.paginate(
      {
        userId,
        isActive: 1,
        ...(query.countryCode ? { countryCode: query.countryCode } : {}),
      },
      query.page ?? 1,
      query.limit ?? 25,
      { orderBy: { createdAt: "desc" } },
    );
  }

  async getById(userId: string, id: string) {
    return this.requireOwned(userId, id);
  }

  create(userId: string, input: CreateTaxScenarioBody) {
    const regime = this.requireRegime(input.countryCode, input.regimeCode);
    const result = computeTaxPlan(input);
    const title =
      input.title?.trim() ||
      `${regime.label} · ${new Intl.NumberFormat("en-IN").format(input.grossSalary)}`;

    return this.model.create({
      userId,
      countryCode: regime.countryCode,
      regimeCode: regime.code,
      financialYear: regime.financialYear,
      assessmentYear: regime.assessmentYear,
      title,
      input: input as Prisma.InputJsonValue,
      result: result as Prisma.InputJsonValue,
    });
  }

  async update(userId: string, id: string, input: UpdateTaxScenarioBody) {
    const existing = await this.requireOwned(userId, id);
    const existingInput = asPlanInput(existing.input);
    const merged: TaxPlanInputBody = {
      countryCode: input.countryCode ?? existing.countryCode,
      regimeCode: input.regimeCode ?? existing.regimeCode,
      grossSalary: input.grossSalary ?? existingInput.grossSalary,
      otherIncome: input.otherIncome ?? existingInput.otherIncome ?? 0,
      section80C: input.section80C ?? existingInput.section80C,
      section80D: input.section80D ?? existingInput.section80D,
      hraExemption: input.hraExemption ?? existingInput.hraExemption,
      homeLoanInterest: input.homeLoanInterest ?? existingInput.homeLoanInterest,
      nps80Ccd: input.nps80Ccd ?? existingInput.nps80Ccd,
      employerNps80Ccd2: input.employerNps80Ccd2 ?? existingInput.employerNps80Ccd2,
      otherDeductions: input.otherDeductions ?? existingInput.otherDeductions,
    };
    const regime = this.requireRegime(merged.countryCode, merged.regimeCode);
    const result = computeTaxPlan(merged);
    const title = input.title?.trim() || existing.title;

    return this.model.update(
      { id },
      {
        countryCode: regime.countryCode,
        regimeCode: regime.code,
        financialYear: regime.financialYear,
        assessmentYear: regime.assessmentYear,
        title,
        input: merged as Prisma.InputJsonValue,
        result: result as Prisma.InputJsonValue,
      },
    );
  }

  async remove(userId: string, input: RemoveTaxScenarioBody) {
    await this.requireOwned(userId, input.id);
    await this.model.update(
      { id: input.id },
      { isActive: 0, deletedAt: new Date() },
    );
    return { id: input.id, removed: true };
  }

  private requireRegime(countryCode: string, regimeCode: string) {
    const regime = findTaxRegime(countryCode, regimeCode);
    if (!regime) {
      throw new HttpError(422, "Unknown tax country or regime");
    }
    return regime;
  }

  private async requireOwned(userId: string, id: string) {
    const scenario = await this.model.readOne({ id });
    if (!scenario || scenario.userId !== userId || scenario.isActive !== 1) {
      throw new HttpError(404, "Tax scenario not found");
    }
    return scenario;
  }
}

function asPlanInput(value: unknown): TaxPlanInputBody {
  if (typeof value !== "object" || value === null) {
    return {
      countryCode: "IN",
      regimeCode: "in_new_fy2025_26",
      grossSalary: 0,
      otherIncome: 0,
    };
  }
  const record = value as Record<string, unknown>;
  return {
    countryCode: typeof record.countryCode === "string" ? record.countryCode : "IN",
    regimeCode:
      typeof record.regimeCode === "string" ? record.regimeCode : "in_new_fy2025_26",
    grossSalary: typeof record.grossSalary === "number" ? record.grossSalary : 0,
    otherIncome: typeof record.otherIncome === "number" ? record.otherIncome : 0,
    section80C: typeof record.section80C === "number" ? record.section80C : undefined,
    section80D: typeof record.section80D === "number" ? record.section80D : undefined,
    hraExemption: typeof record.hraExemption === "number" ? record.hraExemption : undefined,
    homeLoanInterest:
      typeof record.homeLoanInterest === "number" ? record.homeLoanInterest : undefined,
      nps80Ccd: typeof record.nps80Ccd === "number" ? record.nps80Ccd : undefined,
      employerNps80Ccd2:
        typeof record.employerNps80Ccd2 === "number" ? record.employerNps80Ccd2 : undefined,
      otherDeductions:
        typeof record.otherDeductions === "number" ? record.otherDeductions : undefined,
  };
}

export const taxService = new TaxService();
