import { Prisma, type Constant } from "@prisma/client";
import { prisma } from "../utils/prisma.util";
import { PrismaModel } from "./prisma-model";

export class ConstantModel extends PrismaModel<
  Constant,
  Prisma.ConstantUncheckedCreateInput,
  Prisma.ConstantUncheckedUpdateInput,
  Prisma.ConstantWhereInput,
  Prisma.ConstantWhereUniqueInput,
  Prisma.ConstantOrderByWithRelationInput
> {
  constructor() {
    super(prisma.constant, "Constant");
  }
}

export const constantModel = new ConstantModel();
