import { Prisma, type CrmCompanyProfile } from "@prisma/client";
import { prisma } from "../../utils/prisma.util";
import { PrismaModel } from "../prisma-model";

export class CrmCompanyProfileModel extends PrismaModel<
  CrmCompanyProfile,
  Prisma.CrmCompanyProfileUncheckedCreateInput,
  Prisma.CrmCompanyProfileUncheckedUpdateInput,
  Prisma.CrmCompanyProfileWhereInput,
  Prisma.CrmCompanyProfileWhereUniqueInput,
  Prisma.CrmCompanyProfileOrderByWithRelationInput
> {
  constructor() {
    super(prisma.crmCompanyProfile, "CrmCompanyProfile");
  }
}

export const crmCompanyProfileModel = new CrmCompanyProfileModel();
