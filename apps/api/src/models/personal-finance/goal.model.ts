import { Prisma, type Goal } from "@prisma/client";
import { prisma } from "../../lib/prisma.js";
import { PrismaModel } from "../prisma-model.js";

export class GoalModel extends PrismaModel<
  Goal,
  Prisma.GoalUncheckedCreateInput,
  Prisma.GoalUncheckedUpdateInput,
  Prisma.GoalWhereInput,
  Prisma.GoalWhereUniqueInput,
  Prisma.GoalOrderByWithRelationInput
> {
  constructor() {
    super(prisma.goal, "Goal");
  }
}

export const goalModel = new GoalModel();
