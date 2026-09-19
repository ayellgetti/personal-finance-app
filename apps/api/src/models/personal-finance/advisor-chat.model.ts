import { Prisma, type AdvisorChat } from "@prisma/client";
import { prisma } from "../../utils/prisma.util";
import { PrismaModel } from "../prisma-model";

export class AdvisorChatModel extends PrismaModel<
  AdvisorChat,
  Prisma.AdvisorChatUncheckedCreateInput,
  Prisma.AdvisorChatUncheckedUpdateInput,
  Prisma.AdvisorChatWhereInput,
  Prisma.AdvisorChatWhereUniqueInput,
  Prisma.AdvisorChatOrderByWithRelationInput
> {
  constructor() {
    super(prisma.advisorChat, "AdvisorChat");
  }
}

export const advisorChatModel = new AdvisorChatModel();
