import { Prisma, type Investment } from "@prisma/client";
import { prisma } from "../../utils/prisma.util";
import { PrismaModel } from "../prisma-model";

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
