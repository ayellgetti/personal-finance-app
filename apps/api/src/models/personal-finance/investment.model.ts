import { Prisma, type Investment } from "@prisma/client";
import { prisma } from "../../lib/prisma.js";
import { PrismaModel } from "../prisma-model.js";

export class InvestmentModel extends PrismaModel<
  Investment,
  Prisma.InvestmentUncheckedCreateInput,
  Prisma.InvestmentUncheckedUpdateInput,
  Prisma.InvestmentWhereInput,
  Prisma.InvestmentWhereUniqueInput,
  Prisma.InvestmentOrderByWithRelationInput
> {
  constructor() {
    super(prisma.investment, "Investment");
  }
}

export const investmentModel = new InvestmentModel();
