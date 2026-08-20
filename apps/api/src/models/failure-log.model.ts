import { Prisma, type FailureLog } from "@prisma/client";
import { prisma } from "../lib/prisma.js";
import { PrismaModel } from "./prisma-model.js";

export class FailureLogModel extends PrismaModel<
  FailureLog,
  Prisma.FailureLogUncheckedCreateInput,
  Prisma.FailureLogUncheckedUpdateInput,
  Prisma.FailureLogWhereInput,
  Prisma.FailureLogWhereUniqueInput,
  Prisma.FailureLogOrderByWithRelationInput
> {
  constructor() {
    super(prisma.failureLog, "FailureLog");
  }
}

export const failureLogModel = new FailureLogModel();
