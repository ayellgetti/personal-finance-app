import { Prisma, type StatementLine } from "@prisma/client";
import { prisma } from "../../utils/prisma.util";
import { PrismaModel } from "../prisma-model";

export class StatementLineModel extends PrismaModel<
  StatementLine,
  Prisma.StatementLineUncheckedCreateInput,
  Prisma.StatementLineUncheckedUpdateInput,
  Prisma.StatementLineWhereInput,
  Prisma.StatementLineWhereUniqueInput,
  Prisma.StatementLineOrderByWithRelationInput
> {
  constructor() {
    super(prisma.statementLine, "StatementLine");
  }
}

export const statementLineModel = new StatementLineModel();
