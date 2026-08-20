import { Prisma, type ConversationMessage } from "@prisma/client";
import { prisma } from "../../lib/prisma.js";
import { PrismaModel } from "../prisma-model.js";

export class ConversationMessageModel extends PrismaModel<
  ConversationMessage,
  Prisma.ConversationMessageUncheckedCreateInput,
  Prisma.ConversationMessageUncheckedUpdateInput,
  Prisma.ConversationMessageWhereInput,
  Prisma.ConversationMessageWhereUniqueInput,
  Prisma.ConversationMessageOrderByWithRelationInput
> {
  constructor() {
    super(prisma.conversationMessage, "ConversationMessage");
  }
}

export const conversationMessageModel = new ConversationMessageModel();
