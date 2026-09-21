import { rbacService, type RbacService } from "../rbac/rbac.service";
import type { CreateRoleBody, UpdateRoleBody } from "./role.request";

export class RoleService {
  constructor(private readonly rbac: RbacService = rbacService) {}

  listRoles() {
    return this.rbac.listRoles();
  }

  listPermissions() {
    return this.rbac.listPermissions();
  }

  createRole(actorId: string, input: CreateRoleBody) {
    return this.rbac.createRole(actorId, input.name, input.permissionIds);
  }

  async updateRole(actorId: string, roleId: string, input: UpdateRoleBody) {
    return this.rbac.updateRole(roleId, actorId, input);
  }
}

export const roleService = new RoleService();
