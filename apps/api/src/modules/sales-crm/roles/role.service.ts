import { rbacService, type RbacService } from "../rbac/rbac.service";
import type { UpdateRoleBody } from "./role.request";

export class RoleService {
  constructor(private readonly rbac: RbacService = rbacService) {}

  listRoles() {
    return this.rbac.listRoles();
  }

  listPermissions() {
    return this.rbac.listPermissions();
  }

  async updateRole(actorId: string, roleId: string, input: UpdateRoleBody) {
    return this.rbac.replaceRolePermissions(roleId, input.permissionIds, actorId);
  }
}

export const roleService = new RoleService();
