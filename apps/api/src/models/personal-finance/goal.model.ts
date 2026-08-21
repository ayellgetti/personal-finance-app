import { Prisma, type Goal } from "@prisma/client";
import { prisma } from "../../utils/prisma.util";
import { PrismaModel } from "../prisma-model";

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
