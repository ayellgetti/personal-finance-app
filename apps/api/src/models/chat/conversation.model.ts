import { Prisma, type Conversation } from "@prisma/client";
import { prisma } from "../../utils/prisma.util";
import { PrismaModel } from "../prisma-model";

export class ConversationModel extends PrismaModel<
  Conversation,
  Prisma.ConversationUncheckedCreateInput,
  Prisma.ConversationUncheckedUpdateInput,
  Prisma.ConversationWhereInput,
  Prisma.ConversationWhereUniqueInput,
  Prisma.ConversationOrderByWithRelationInput
> {
  constructor() {
    super(prisma.conversation, "Conversation");
  }
}

export const conversationModel = new ConversationModel();
