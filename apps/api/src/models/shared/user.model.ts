import { Prisma, type User } from "@prisma/client";
import { prisma } from "../../lib/prisma.js";
import type { PublicRecord } from "../../utils/model.util.js";
import { PrismaModel } from "../prisma-model.js";

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

export type PublicUser = PublicRecord<User>;

export class UserModel extends PrismaModel<
  User,
  CreateUserInput,
  UpdateUserInput | SetPasswordInput,
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
}

export const userModel = new UserModel();
