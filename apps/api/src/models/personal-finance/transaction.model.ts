import { Prisma, type Transaction } from "@prisma/client";
import { prisma } from "../../lib/prisma.js";
import { PrismaModel } from "../prisma-model.js";

export class TransactionModel extends PrismaModel<
  Transaction,
  Prisma.TransactionUncheckedCreateInput,
  Prisma.TransactionUncheckedUpdateInput,
  Prisma.TransactionWhereInput,
  Prisma.TransactionWhereUniqueInput,
  Prisma.TransactionOrderByWithRelationInput
> {
  constructor() {
    super(prisma.transaction, "Transaction");
  }
}

export const transactionModel = new TransactionModel();
