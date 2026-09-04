import bcrypt from "bcryptjs";
import { Prisma } from "@prisma/client";
import { setting } from "../../../config/setting";
import { HttpError } from "../../../utils/http-error.util";
import {
  userModel,
  type PublicUser,
  type UserModel,
} from "../../../models/index";
import { actorCreate, actorUpdate, requireActive } from "../crm.util";
import { rbacService, type RbacService } from "../rbac/rbac.service";
import type {
  CreateCrmUserBody,
  ListCrmUsersQuery,
  UpdateCrmUserBody,
} from "./user.request";

export type CrmUserListItem = PublicUser & { roleIds: string[] };

export class CrmUserService {
  constructor(
    private readonly users: UserModel = userModel,
    private readonly rbac: RbacService = rbacService,
  ) {}

  async list(query: ListCrmUsersQuery) {
    const where: Prisma.UserWhereInput = { isActive: 1 };
    if (query.search) {
      where.OR = [
        { firstName: { contains: query.search, mode: "insensitive" } },
        { lastName: { contains: query.search, mode: "insensitive" } },
        { email: { contains: query.search, mode: "insensitive" } },
        { mobileNo: { contains: query.search, mode: "insensitive" } },
      ];
    }
    const page = await this.users.paginate(where, query.page ?? 1, query.limit ?? 25, {
      orderBy: { createdAt: "desc" },
    });
    const items = await Promise.all(
      page.items.map(async (user) => ({
        ...user,
        roleIds: await this.rbac.listRoleIdsForUser(user.id),
      })),
    );
    return { ...page, items };
  }

  async getById(id: string): Promise<CrmUserListItem> {
    const user = requireActive(await this.users.findById(id), "User");
    return {
      ...user,
      roleIds: await this.rbac.listRoleIdsForUser(user.id),
    };
  }

  async create(actorId: string, input: CreateCrmUserBody): Promise<CrmUserListItem> {
    if (await this.users.findByEmail(input.email)) {
      throw new HttpError(409, "Duplicate email is not allowed");
    }
    if (await this.users.findByMobileNo(input.mobileNo)) {
      throw new HttpError(409, "Duplicate mobileNo is not allowed");
    }
    await this.rbac.assertRoleIds(input.roleIds);
    const password = await bcrypt.hash(input.password, setting.bcryptRounds);
    const user = await this.users.create({
      firstName: input.firstName,
      lastName: input.lastName,
      dob: new Date(input.dob),
      gender: input.gender,
      countryCode: input.countryCode,
      mobileNo: input.mobileNo,
      email: input.email,
      password,
      ...actorCreate(actorId),
    });
    await this.rbac.replaceUserRoles(user.id, input.roleIds, actorId);
    return {
      ...user,
      roleIds: input.roleIds,
    };
  }

  async update(
    actorId: string,
    id: string,
    input: UpdateCrmUserBody,
  ): Promise<CrmUserListItem> {
    const existing = requireActive(await this.users.findById(id), "User");
    if (input.email && input.email.toLowerCase() !== existing.email) {
      const duplicate = await this.users.findByEmail(input.email);
      if (duplicate && duplicate.id !== id) {
        throw new HttpError(409, "Duplicate email is not allowed");
      }
    }
    if (input.mobileNo && input.mobileNo !== existing.mobileNo) {
      const duplicate = await this.users.findByMobileNo(input.mobileNo);
      if (duplicate && duplicate.id !== id) {
        throw new HttpError(409, "Duplicate mobileNo is not allowed");
      }
    }
    if (input.roleIds) {
      await this.rbac.assertRoleIds(input.roleIds);
      await this.rbac.replaceUserRoles(id, input.roleIds, actorId);
    }
    const { roleIds: _roleIds, dob, ...profile } = input;
    const hasProfile = Object.keys(profile).length > 0 || dob !== undefined;
    if (hasProfile) {
      await this.users.updateById(id, {
        ...profile,
        ...(profile.email ? { email: profile.email.toLowerCase() } : {}),
        ...(dob ? { dob: new Date(dob) } : {}),
        ...actorUpdate(actorId),
      });
    }
    return this.getById(id);
  }
}

export const crmUserService = new CrmUserService();
