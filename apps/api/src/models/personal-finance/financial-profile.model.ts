import { Prisma, type FinancialProfile } from "@prisma/client";
import { prisma } from "../../lib/prisma.js";
import { PrismaModel } from "../prisma-model.js";

export class FinancialProfileModel extends PrismaModel<
  FinancialProfile,
  Prisma.FinancialProfileUncheckedCreateInput,
  Prisma.FinancialProfileUncheckedUpdateInput,
  Prisma.FinancialProfileWhereInput,
  Prisma.FinancialProfileWhereUniqueInput,
  Prisma.FinancialProfileOrderByWithRelationInput
> {
  constructor() {
    super(prisma.financialProfile, "FinancialProfile");
  }
}

export const financialProfileModel = new FinancialProfileModel();
