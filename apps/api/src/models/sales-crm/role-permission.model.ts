import { Prisma, type RolePermission } from "@prisma/client";
import { prisma } from "../../utils/prisma.util";
import { PrismaModel } from "../prisma-model";

export class RolePermissionModel extends PrismaModel<
  RolePermission,
  Prisma.RolePermissionUncheckedCreateInput,
  Prisma.RolePermissionUncheckedUpdateInput,
  Prisma.RolePermissionWhereInput,
  Prisma.RolePermissionWhereUniqueInput,
  Prisma.RolePermissionOrderByWithRelationInput
> {
  constructor() {
    super(prisma.rolePermission, "RolePermission");
  }
}

export const rolePermissionModel = new RolePermissionModel();
