import { Prisma, type PlanShare } from "@prisma/client";
import { prisma } from "../../utils/prisma.util";
import { PrismaModel } from "../prisma-model";

export class PlanShareModel extends PrismaModel<
  PlanShare,
  Prisma.PlanShareUncheckedCreateInput,
  Prisma.PlanShareUncheckedUpdateInput,
  Prisma.PlanShareWhereInput,
  Prisma.PlanShareWhereUniqueInput,
  Prisma.PlanShareOrderByWithRelationInput
> {
  constructor() {
    super(prisma.planShare, "PlanShare");
  }
}

export const planShareModel = new PlanShareModel();
