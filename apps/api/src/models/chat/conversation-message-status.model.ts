import { Prisma, type ConversationMessageStatus } from "@prisma/client";
import { prisma } from "../../lib/prisma.js";
import { PrismaModel } from "../prisma-model.js";

export class ConversationMessageStatusModel extends PrismaModel<
  ConversationMessageStatus,
  Prisma.ConversationMessageStatusUncheckedCreateInput,
  Prisma.ConversationMessageStatusUncheckedUpdateInput,
  Prisma.ConversationMessageStatusWhereInput,
  Prisma.ConversationMessageStatusWhereUniqueInput,
  Prisma.ConversationMessageStatusOrderByWithRelationInput
> {
  constructor() {
    super(prisma.conversationMessageStatus, "ConversationMessageStatus");
  }
}

export const conversationMessageStatusModel =
  new ConversationMessageStatusModel();
