import { Prisma, type User } from "@prisma/client";
import { HttpError } from "../../utils/http-error.util";
import { prisma } from "../../utils/prisma.util";
import type { PublicRecord } from "../../utils/model.util";
import { PrismaModel } from "../prisma-model";

export type CreateUserInput = {
  firstName: string;
  lastName: string;
  dob: Date;
  gender: string;
  mobileNo: string;
  email: string;
  password: string;
};

export type UpdateUserInput = Partial<
  Pick<User, "firstName" | "lastName" | "gender" | "avatar" | "avatarBackground" | "quickStep">
>;

export type SetPasswordInput = Pick<User, "password" | "oldPasswords">;

export type AiReportUsageInput = { aiReportCount: { increment: number } };

export type AiReportQuota = {
  used: number;
  limit: number;
  remaining: number;
};

export type PublicUser = PublicRecord<User>;

function toAiReportQuota(
  user: Pick<User, "aiReportCount" | "aiReportLimit">,
): AiReportQuota {
  return {
    used: user.aiReportCount,
    limit: user.aiReportLimit,
    remaining: Math.max(0, user.aiReportLimit - user.aiReportCount),
  };
}

export class UserModel extends PrismaModel<
  User,
  CreateUserInput,
  UpdateUserInput | SetPasswordInput | AiReportUsageInput,
  Prisma.UserWhereInput,
  Prisma.UserWhereUniqueInput,
  Prisma.UserOrderByWithRelationInput
> {
  protected override hidden = ["password"];

  constructor() {
    super(prisma.user, "User");
  }

  findById(id: string, options?: { includeHidden?: boolean }): Promise<User | null> {
    return this.readOne({ id }, options);
  }

  findByEmail(
    email: string,
    options?: { includeHidden?: boolean },
  ): Promise<User | null> {
    return this.readOne({ email: email.toLowerCase() }, options);
  }

  findByMobileNo(
    mobileNo: string,
    options?: { includeHidden?: boolean },
  ): Promise<User | null> {
    return this.readOne({ mobileNo }, options);
  }

  override create(data: CreateUserInput): Promise<User> {
    return super.create({ ...data, email: data.email.toLowerCase() });
  }

  updateById(id: string, data: UpdateUserInput): Promise<User> {
    return this.update({ id }, data);
  }

  setPassword(id: string, data: SetPasswordInput): Promise<User> {
    return this.update({ id }, data);
  }

  async readAiReportQuota(id: string): Promise<AiReportQuota> {
    const user = await this.findById(id);
    if (!user) {
      throw new HttpError(404, "User not found");
    }
    return toAiReportQuota(user);
  }

  /** Increments only while the user is below their allowance so parallel calls cannot overspend it. */
  async consumeAiReport(id: string): Promise<AiReportQuota> {
    await this.updateMany(
      { id, aiReportCount: { lt: prisma.user.fields.aiReportLimit } },
      { aiReportCount: { increment: 1 } },
    );
    return this.readAiReportQuota(id);
  }
}

export const userModel = new UserModel();
