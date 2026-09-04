import { Prisma, type CrmFollowUp } from "@prisma/client";
import { prisma } from "../../utils/prisma.util";
import { PrismaModel } from "../prisma-model";

export class CrmFollowUpModel extends PrismaModel<
  CrmFollowUp,
  Prisma.CrmFollowUpUncheckedCreateInput,
  Prisma.CrmFollowUpUncheckedUpdateInput,
  Prisma.CrmFollowUpWhereInput,
  Prisma.CrmFollowUpWhereUniqueInput,
  Prisma.CrmFollowUpOrderByWithRelationInput
> {
  constructor() {
    super(prisma.crmFollowUp, "CrmFollowUp");
  }
}

export const crmFollowUpModel = new CrmFollowUpModel();
