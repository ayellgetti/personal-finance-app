import { Prisma, type CrmCalendarEvent } from "@prisma/client";
import { prisma } from "../../utils/prisma.util";
import { PrismaModel } from "../prisma-model";

export class CrmCalendarEventModel extends PrismaModel<
  CrmCalendarEvent,
  Prisma.CrmCalendarEventUncheckedCreateInput,
  Prisma.CrmCalendarEventUncheckedUpdateInput,
  Prisma.CrmCalendarEventWhereInput,
  Prisma.CrmCalendarEventWhereUniqueInput,
  Prisma.CrmCalendarEventOrderByWithRelationInput
> {
  constructor() {
    super(prisma.crmCalendarEvent, "CrmCalendarEvent");
  }
}

export const crmCalendarEventModel = new CrmCalendarEventModel();
