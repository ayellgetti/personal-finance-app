import { Prisma, type UserRole } from "@prisma/client";
import { prisma } from "../../utils/prisma.util";
import { PrismaModel } from "../prisma-model";

export class UserRoleModel extends PrismaModel<
  UserRole,
  Prisma.UserRoleUncheckedCreateInput,
  Prisma.UserRoleUncheckedUpdateInput,
  Prisma.UserRoleWhereInput,
  Prisma.UserRoleWhereUniqueInput,
  Prisma.UserRoleOrderByWithRelationInput
> {
  constructor() {
    super(prisma.userRole, "UserRole");
  }
}

export const userRoleModel = new UserRoleModel();
