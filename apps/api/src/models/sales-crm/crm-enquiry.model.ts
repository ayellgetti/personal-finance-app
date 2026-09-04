import { Prisma, type CrmEnquiry } from "@prisma/client";
import { prisma } from "../../utils/prisma.util";
import { PrismaModel } from "../prisma-model";

export class CrmEnquiryModel extends PrismaModel<
  CrmEnquiry,
  Prisma.CrmEnquiryUncheckedCreateInput,
  Prisma.CrmEnquiryUncheckedUpdateInput,
  Prisma.CrmEnquiryWhereInput,
  Prisma.CrmEnquiryWhereUniqueInput,
  Prisma.CrmEnquiryOrderByWithRelationInput
> {
  constructor() {
    super(prisma.crmEnquiry, "CrmEnquiry");
  }
}

export const crmEnquiryModel = new CrmEnquiryModel();
