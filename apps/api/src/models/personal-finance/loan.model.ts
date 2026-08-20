import { Prisma, type Loan } from "@prisma/client";
import { prisma } from "../../lib/prisma.js";
import { PrismaModel } from "../prisma-model.js";

export class LoanModel extends PrismaModel<
  Loan,
  Prisma.LoanUncheckedCreateInput,
  Prisma.LoanUncheckedUpdateInput,
  Prisma.LoanWhereInput,
  Prisma.LoanWhereUniqueInput,
  Prisma.LoanOrderByWithRelationInput
> {
  constructor() {
    super(prisma.loan, "Loan");
  }
}

export const loanModel = new LoanModel();
