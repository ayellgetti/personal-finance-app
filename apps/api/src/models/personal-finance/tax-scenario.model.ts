import { Prisma, type TaxScenario } from "@prisma/client";
import { prisma } from "../../utils/prisma.util";
import { PrismaModel } from "../prisma-model";

export class TaxScenarioModel extends PrismaModel<
  TaxScenario,
  Prisma.TaxScenarioUncheckedCreateInput,
  Prisma.TaxScenarioUncheckedUpdateInput,
  Prisma.TaxScenarioWhereInput,
  Prisma.TaxScenarioWhereUniqueInput,
  Prisma.TaxScenarioOrderByWithRelationInput
> {
  constructor() {
    super(prisma.taxScenario, "TaxScenario");
  }
}

export const taxScenarioModel = new TaxScenarioModel();
