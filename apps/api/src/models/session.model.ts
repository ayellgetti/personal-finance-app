import { Prisma, type Session } from "@prisma/client";
import { prisma } from "../utils/prisma.util";
import { PrismaModel } from "./prisma-model";

export class SessionModel extends PrismaModel<
  Session,
  Prisma.SessionUncheckedCreateInput,
  Prisma.SessionUncheckedUpdateInput,
  Prisma.SessionWhereInput,
  Prisma.SessionWhereUniqueInput,
  Prisma.SessionOrderByWithRelationInput
> {
  constructor() {
    super(prisma.session, "Session");
  }
}

export const sessionModel = new SessionModel();
