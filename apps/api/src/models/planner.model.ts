import { Prisma, type Planner } from "@prisma/client";
import { prisma } from "../utils/prisma.util";
import { PrismaModel } from "./prisma-model";

export class PlannerModel extends PrismaModel<
  Planner,
  Prisma.PlannerUncheckedCreateInput,
  Prisma.PlannerUncheckedUpdateInput,
  Prisma.PlannerWhereInput,
  Prisma.PlannerWhereUniqueInput,
  Prisma.PlannerOrderByWithRelationInput
> {
  constructor() {
    super(prisma.planner, "Planner");
  }
}

export const plannerModel = new PlannerModel();
