import type { User } from "@prisma/client";
import bcrypt from "bcryptjs";
import { setting } from "../../../config/setting";
import { HttpError } from "../../../utils/http-error.util";
import {
  userModel,
  type CreateUserInput,
  type PublicUser,
  type UpdateUserInput,
  type UserModel,
} from "../../../models/index";
import {
  refreshSessionModel,
  type RefreshSessionModel,
} from "../auth/auth.store";

const PASSWORD_HISTORY_LIMIT = 5;

export class UserService {
  constructor(
    private readonly model: UserModel = userModel,
    private readonly sessions: RefreshSessionModel = refreshSessionModel,
  ) {}

  async findByEmail(email: string): Promise<User | null> {
    return this.model.findByEmail(email, { includeHidden: true });
  }

  async findByMobileNo(mobileNo: string): Promise<User | null> {
    return this.model.findByMobileNo(mobileNo, { includeHidden: true });
  }

  async count(): Promise<number> {
    return this.model.count();
  }

  async getById(id: string): Promise<PublicUser> {
    const user = await this.model.findById(id);
    if (!user) {
      throw new HttpError(404, "User not found");
    }
    return user as PublicUser;
  }

  async create(input: CreateUserInput): Promise<PublicUser> {
    return this.model.create(input) as Promise<PublicUser>;
  }

  async updateMe(id: string, input: UpdateUserInput): Promise<PublicUser> {
    return this.model.updateById(id, input) as Promise<PublicUser>;
  }

  async changePassword(
    id: string,
    input: { currentPassword: string; newPassword: string },
  ): Promise<PublicUser> {
    const user = await this.model.findById(id, { includeHidden: true });
    if (!user) {
      throw new HttpError(404, "User not found");
    }

    if (!(await bcrypt.compare(input.currentPassword, user.password))) {
      throw new HttpError(400, "Current password is incorrect");
    }

    return this.replacePassword(user, input.newPassword);
  }

  async resetPassword(user: User, newPassword: string): Promise<PublicUser> {
    return this.replacePassword(user, newPassword);
  }

  withoutHidden(user: User): PublicUser {
    return this.model.withoutHidden(user);
  }

  private async replacePassword(user: User, newPassword: string): Promise<PublicUser> {
    if (await bcrypt.compare(newPassword, user.password)) {
      throw new HttpError(400, "New password must be different from the current password");
    }

    for (const previous of user.oldPasswords) {
      if (await bcrypt.compare(newPassword, previous)) {
        throw new HttpError(400, "Password was used recently. Choose a different password");
      }
    }

    const password = await bcrypt.hash(newPassword, setting.bcryptRounds);
    const oldPasswords = [user.password, ...user.oldPasswords].slice(0, PASSWORD_HISTORY_LIMIT);
    const updated = await this.model.setPassword(user.id, { password, oldPasswords });
    await this.sessions.deleteAllForUser(user.id);
    return this.model.withoutHidden(updated);
  }
}

export const userService = new UserService();
