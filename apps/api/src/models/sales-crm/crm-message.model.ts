import { Prisma, type CrmMessage, type CrmMessageTemplate } from "@prisma/client";
import { prisma } from "../../utils/prisma.util";
import { PrismaModel } from "../prisma-model";

export class CrmMessageTemplateModel extends PrismaModel<
  CrmMessageTemplate,
  Prisma.CrmMessageTemplateUncheckedCreateInput,
  Prisma.CrmMessageTemplateUncheckedUpdateInput,
  Prisma.CrmMessageTemplateWhereInput,
  Prisma.CrmMessageTemplateWhereUniqueInput,
  Prisma.CrmMessageTemplateOrderByWithRelationInput
> {
  constructor() {
    super(prisma.crmMessageTemplate, "CrmMessageTemplate");
  }
}

export class CrmMessageModel extends PrismaModel<
  CrmMessage,
  Prisma.CrmMessageUncheckedCreateInput,
  Prisma.CrmMessageUncheckedUpdateInput,
  Prisma.CrmMessageWhereInput,
  Prisma.CrmMessageWhereUniqueInput,
  Prisma.CrmMessageOrderByWithRelationInput
> {
  constructor() {
    super(prisma.crmMessage, "CrmMessage");
  }
}

export const crmMessageTemplateModel = new CrmMessageTemplateModel();
export const crmMessageModel = new CrmMessageModel();
