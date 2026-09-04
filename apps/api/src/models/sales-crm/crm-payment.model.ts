import { Prisma, type CrmPayment } from "@prisma/client";
import { prisma } from "../../utils/prisma.util";
import { PrismaModel } from "../prisma-model";

export class CrmPaymentModel extends PrismaModel<
  CrmPayment,
  Prisma.CrmPaymentUncheckedCreateInput,
  Prisma.CrmPaymentUncheckedUpdateInput,
  Prisma.CrmPaymentWhereInput,
  Prisma.CrmPaymentWhereUniqueInput,
  Prisma.CrmPaymentOrderByWithRelationInput
> {
  constructor() {
    super(prisma.crmPayment, "CrmPayment");
  }

  async sumAmount(where: Prisma.CrmPaymentWhereInput): Promise<number> {
    const result = await prisma.crmPayment.aggregate({
      where,
      _sum: { amount: true },
    });
    return result._sum.amount ?? 0;
  }
}

export const crmPaymentModel = new CrmPaymentModel();
