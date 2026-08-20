import { Prisma, type Notification } from "@prisma/client";
import { prisma } from "../../lib/prisma.js";
import { PrismaModel } from "../prisma-model.js";

export class NotificationModel extends PrismaModel<
  Notification,
  Prisma.NotificationUncheckedCreateInput,
  Prisma.NotificationUncheckedUpdateInput,
  Prisma.NotificationWhereInput,
  Prisma.NotificationWhereUniqueInput,
  Prisma.NotificationOrderByWithRelationInput
> {
  constructor() {
    super(prisma.notification, "Notification");
  }
}

export const notificationModel = new NotificationModel();
