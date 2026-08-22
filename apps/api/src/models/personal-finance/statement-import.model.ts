import { Prisma, type StatementImport } from "@prisma/client";
import { prisma } from "../../utils/prisma.util";
import { PrismaModel } from "../prisma-model";

export class StatementImportModel extends PrismaModel<
  StatementImport,
  Prisma.StatementImportUncheckedCreateInput,
  Prisma.StatementImportUncheckedUpdateInput,
  Prisma.StatementImportWhereInput,
  Prisma.StatementImportWhereUniqueInput,
  Prisma.StatementImportOrderByWithRelationInput
> {
  constructor() {
    super(prisma.statementImport, "StatementImport");
  }
}

export const statementImportModel = new StatementImportModel();
