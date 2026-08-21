import { Prisma, type Insurance } from "@prisma/client";
import { prisma } from "../../utils/prisma.util";
import { PrismaModel } from "../prisma-model";

export class InsuranceModel extends PrismaModel<
  Insurance,
  Prisma.InsuranceUncheckedCreateInput,
  Prisma.InsuranceUncheckedUpdateInput,
  Prisma.InsuranceWhereInput,
  Prisma.InsuranceWhereUniqueInput,
  Prisma.InsuranceOrderByWithRelationInput
> {
  constructor() {
    super(prisma.insurance, "Insurance");
  }
}

export const insuranceModel = new InsuranceModel();
