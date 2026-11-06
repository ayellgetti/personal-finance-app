import { Prisma, type FreedomScenario } from "@prisma/client";
import { prisma } from "../../utils/prisma.util";
import { PrismaModel } from "../prisma-model";

export class FreedomScenarioModel extends PrismaModel<
  FreedomScenario,
  Prisma.FreedomScenarioUncheckedCreateInput,
  Prisma.FreedomScenarioUncheckedUpdateInput,
  Prisma.FreedomScenarioWhereInput,
  Prisma.FreedomScenarioWhereUniqueInput,
  Prisma.FreedomScenarioOrderByWithRelationInput
> {
  constructor() {
    super(prisma.freedomScenario, "FreedomScenario");
  }
}

export const freedomScenarioModel = new FreedomScenarioModel();
