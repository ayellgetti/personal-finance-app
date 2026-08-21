import { Prisma, type ConversationMessageStatus } from "@prisma/client";
import { prisma } from "../../utils/prisma.util";
import { PrismaModel } from "../prisma-model";

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
