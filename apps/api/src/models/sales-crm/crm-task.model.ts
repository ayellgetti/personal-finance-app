import { Prisma, type CrmTask } from "@prisma/client";
import { prisma } from "../../utils/prisma.util";
import { PrismaModel } from "../prisma-model";

export class CrmTaskModel extends PrismaModel<
  CrmTask,
  Prisma.CrmTaskUncheckedCreateInput,
  Prisma.CrmTaskUncheckedUpdateInput,
  Prisma.CrmTaskWhereInput,
  Prisma.CrmTaskWhereUniqueInput,
  Prisma.CrmTaskOrderByWithRelationInput
> {
  constructor() {
    super(prisma.crmTask, "CrmTask");
  }
}

export const crmTaskModel = new CrmTaskModel();
