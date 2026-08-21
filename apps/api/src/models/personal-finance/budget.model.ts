import { Prisma, type Budget } from "@prisma/client";
import { prisma } from "../../utils/prisma.util";
import { PrismaModel } from "../prisma-model";

export class BudgetModel extends PrismaModel<
  Budget,
  Prisma.BudgetUncheckedCreateInput,
  Prisma.BudgetUncheckedUpdateInput,
  Prisma.BudgetWhereInput,
  Prisma.BudgetWhereUniqueInput,
  Prisma.BudgetOrderByWithRelationInput
> {
  constructor() {
    super(prisma.budget, "Budget");
  }
}

export const budgetModel = new BudgetModel();
