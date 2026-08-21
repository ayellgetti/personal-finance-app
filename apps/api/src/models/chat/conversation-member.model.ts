import { Prisma, type ConversationMember } from "@prisma/client";
import { prisma } from "../../utils/prisma.util";
import { PrismaModel } from "../prisma-model";

export class ConversationMemberModel extends PrismaModel<
  ConversationMember,
  Prisma.ConversationMemberUncheckedCreateInput,
  Prisma.ConversationMemberUncheckedUpdateInput,
  Prisma.ConversationMemberWhereInput,
  Prisma.ConversationMemberWhereUniqueInput,
  Prisma.ConversationMemberOrderByWithRelationInput
> {
  constructor() {
    super(prisma.conversationMember, "ConversationMember");
  }
}

export const conversationMemberModel = new ConversationMemberModel();
