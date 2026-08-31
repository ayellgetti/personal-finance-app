import type { Prisma } from "@prisma/client";
import {
  calculatorScenarioModel,
  type CalculatorScenarioModel,
} from "../../../models/index";
import { HttpError } from "../../../utils/http-error.util";
import { computeCalculator, type CalculatorInput } from "./calculator.engine";
import {
  calculatorInputSchema,
  type CalculatorInputBody,
  type CreateCalculatorScenarioBody,
  type ListCalculatorScenariosQuery,
  type RemoveCalculatorScenarioBody,
  type UpdateCalculatorScenarioBody,
} from "./calculator.request";

const DEFAULT_TITLES: Record<CalculatorInput["type"], string> = {
  lumpsum: "Lumpsum projection",
  sip: "SIP projection",
  step_up_sip: "Step-up SIP projection",
  emi: "EMI calculation",
  loan: "Loan payoff",
  future: "Future target",
  depreciation: "Depreciation schedule",
  currency: "INR currency conversion",
  number_words: "Number in words",
  bond_yield: "Bond yield",
  stock: "Stock return",
  irr: "IRR calculation",
};

function compute(input: CalculatorInputBody) {
  try {
    return computeCalculator(input);
  } catch (error) {
    throw new HttpError(
      422,
      error instanceof Error ? error.message : "Calculator input cannot be computed",
    );
  }
}

function inputFromCreate(body: CreateCalculatorScenarioBody): CalculatorInputBody {
  const { title: _title, ...input } = body;
  return calculatorInputSchema.parse(input);
}

export class CalculatorService {
  constructor(
    private readonly model: CalculatorScenarioModel = calculatorScenarioModel,
  ) {}

  preview(input: CalculatorInputBody) {
    return compute(input);
  }

  list(userId: string, query: ListCalculatorScenariosQuery) {
    return this.model.paginate(
      {
        userId,
        isActive: 1,
        ...(query.type ? { type: query.type } : {}),
      },
      query.page ?? 1,
      query.limit ?? 25,
      { orderBy: { createdAt: "desc" } },
    );
  }

  async getById(userId: string, id: string) {
    return this.requireOwned(userId, id);
  }

  create(userId: string, body: CreateCalculatorScenarioBody) {
    const input = inputFromCreate(body);
    const result = compute(input);
    return this.model.create({
      userId,
      type: input.type,
      title: body.title?.trim() || DEFAULT_TITLES[input.type],
      input: input as Prisma.InputJsonValue,
      result: result as Prisma.InputJsonValue,
      createdBy: userId,
      updatedBy: userId,
    });
  }

  async update(
    userId: string,
    id: string,
    body: UpdateCalculatorScenarioBody,
  ) {
    const existing = await this.requireOwned(userId, id);
    const existingInput = calculatorInputSchema.safeParse(existing.input);
    if (!existingInput.success) {
      throw new HttpError(422, "Saved calculator input is invalid");
    }

    const { title, ...changes } = body;
    const typeChanged = changes.type !== undefined && changes.type !== existing.type;
    const candidate = typeChanged
      ? changes
      : { ...existingInput.data, ...changes };
    const parsed = calculatorInputSchema.safeParse(candidate);
    if (!parsed.success) {
      throw new HttpError(422, "Updated calculator input is incomplete or invalid", {
        fieldErrors: parsed.error.flatten().fieldErrors,
      });
    }

    const result = compute(parsed.data);
    return this.model.update(
      { id },
      {
        type: parsed.data.type,
        title: title?.trim() || existing.title,
        input: parsed.data as Prisma.InputJsonValue,
        result: result as Prisma.InputJsonValue,
        updatedBy: userId,
      },
    );
  }

  async remove(userId: string, input: RemoveCalculatorScenarioBody) {
    await this.requireOwned(userId, input.id);
    await this.model.update(
      { id: input.id },
      {
        isActive: 0,
        deletedAt: new Date(),
        deletedBy: userId,
        updatedBy: userId,
      },
    );
    return { id: input.id, removed: true };
  }

  private async requireOwned(userId: string, id: string) {
    const scenario = await this.model.readOne({ id });
    if (!scenario || scenario.userId !== userId || scenario.isActive !== 1) {
      throw new HttpError(404, "Calculator scenario not found");
    }
    return scenario;
  }
}

export const calculatorService = new CalculatorService();
