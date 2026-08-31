import { Prisma, type CalculatorScenario } from "@prisma/client";
import { prisma } from "../../utils/prisma.util";
import { PrismaModel } from "../prisma-model";

export class CalculatorScenarioModel extends PrismaModel<
  CalculatorScenario,
  Prisma.CalculatorScenarioUncheckedCreateInput,
  Prisma.CalculatorScenarioUncheckedUpdateInput,
  Prisma.CalculatorScenarioWhereInput,
  Prisma.CalculatorScenarioWhereUniqueInput,
  Prisma.CalculatorScenarioOrderByWithRelationInput
> {
  constructor() {
    super(prisma.calculatorScenario, "CalculatorScenario");
  }
}

export const calculatorScenarioModel = new CalculatorScenarioModel();
