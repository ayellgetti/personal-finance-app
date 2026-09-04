import type { PublicUser } from "../../../models/index";
import { userService, type UserService } from "../../shared/user/user.service";
import { HttpError } from "../../../utils/http-error.util";
import { rbacService, type RbacService } from "../rbac/rbac.service";

export type CrmMeResult = {
  user: PublicUser;
  roles: { id: string; name: string; slug: string }[];
  permissions: string[];
};

export class MeService {
  constructor(
    private readonly rbac: RbacService = rbacService,
    private readonly users: Pick<UserService, "getById"> = userService,
  ) {}

  async getMe(userId: string): Promise<CrmMeResult> {
    await this.rbac.ensureCatalog(userId);
    await this.rbac.ensureFirstAdmin(userId);
    const session = await this.rbac.getSession(userId);
    if (session.roles.length === 0) {
      throw new HttpError(403, "Forbidden");
    }
    const user = await this.users.getById(userId);
    return {
      user,
      roles: session.roles,
      permissions: session.permissions,
    };
  }
}

export const meService = new MeService();
