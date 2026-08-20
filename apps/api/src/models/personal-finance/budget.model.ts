import { Prisma, type Budget } from "@prisma/client";
import { prisma } from "../../lib/prisma.js";
import { PrismaModel } from "../prisma-model.js";

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
