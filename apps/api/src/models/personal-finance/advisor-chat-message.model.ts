import { Prisma, type AdvisorChatMessage } from "@prisma/client";
import { prisma } from "../../utils/prisma.util";
import { PrismaModel } from "../prisma-model";

export class AdvisorChatMessageModel extends PrismaModel<
  AdvisorChatMessage,
  Prisma.AdvisorChatMessageUncheckedCreateInput,
  Prisma.AdvisorChatMessageUncheckedUpdateInput,
  Prisma.AdvisorChatMessageWhereInput,
  Prisma.AdvisorChatMessageWhereUniqueInput,
  Prisma.AdvisorChatMessageOrderByWithRelationInput
> {
  constructor() {
    super(prisma.advisorChatMessage, "AdvisorChatMessage");
  }
}

export const advisorChatMessageModel = new AdvisorChatMessageModel();
