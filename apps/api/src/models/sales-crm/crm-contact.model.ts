import { Prisma, type CrmContact } from "@prisma/client";
import { prisma } from "../../utils/prisma.util";
import { PrismaModel } from "../prisma-model";

export class CrmContactModel extends PrismaModel<
  CrmContact,
  Prisma.CrmContactUncheckedCreateInput,
  Prisma.CrmContactUncheckedUpdateInput,
  Prisma.CrmContactWhereInput,
  Prisma.CrmContactWhereUniqueInput,
  Prisma.CrmContactOrderByWithRelationInput
> {
  constructor() {
    super(prisma.crmContact, "CrmContact");
  }
}

export const crmContactModel = new CrmContactModel();
