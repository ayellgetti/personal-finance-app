import { Prisma, type CrmClient } from "@prisma/client";
import { prisma } from "../../utils/prisma.util";
import { PrismaModel } from "../prisma-model";

export class CrmClientModel extends PrismaModel<
  CrmClient,
  Prisma.CrmClientUncheckedCreateInput,
  Prisma.CrmClientUncheckedUpdateInput,
  Prisma.CrmClientWhereInput,
  Prisma.CrmClientWhereUniqueInput,
  Prisma.CrmClientOrderByWithRelationInput
> {
  constructor() {
    super(prisma.crmClient, "CrmClient");
  }
}

export const crmClientModel = new CrmClientModel();
