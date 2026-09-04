import { Prisma, type Role } from "@prisma/client";
import { prisma } from "../../utils/prisma.util";
import { PrismaModel } from "../prisma-model";

export class RoleModel extends PrismaModel<
  Role,
  Prisma.RoleUncheckedCreateInput,
  Prisma.RoleUncheckedUpdateInput,
  Prisma.RoleWhereInput,
  Prisma.RoleWhereUniqueInput,
  Prisma.RoleOrderByWithRelationInput
> {
  constructor() {
    super(prisma.role, "Role");
  }
}

export const roleModel = new RoleModel();
