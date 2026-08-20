import { Prisma, type Socket } from "@prisma/client";
import { prisma } from "../lib/prisma.js";
import { PrismaModel } from "./prisma-model.js";

export class SocketModel extends PrismaModel<
  Socket,
  Prisma.SocketUncheckedCreateInput,
  Prisma.SocketUncheckedUpdateInput,
  Prisma.SocketWhereInput,
  Prisma.SocketWhereUniqueInput,
  Prisma.SocketOrderByWithRelationInput
> {
  constructor() {
    super(prisma.socket, "Socket");
  }
}

export const socketModel = new SocketModel();
