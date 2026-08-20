import { Prisma, type Insurance } from "@prisma/client";
import { prisma } from "../../lib/prisma.js";
import { PrismaModel } from "../prisma-model.js";

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
