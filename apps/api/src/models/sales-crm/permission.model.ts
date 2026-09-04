import { Prisma, type Permission } from "@prisma/client";
import { prisma } from "../../utils/prisma.util";
import { PrismaModel } from "../prisma-model";

export class PermissionModel extends PrismaModel<
  Permission,
  Prisma.PermissionUncheckedCreateInput,
  Prisma.PermissionUncheckedUpdateInput,
  Prisma.PermissionWhereInput,
  Prisma.PermissionWhereUniqueInput,
  Prisma.PermissionOrderByWithRelationInput
> {
  constructor() {
    super(prisma.permission, "Permission");
  }
}

export const permissionModel = new PermissionModel();
