import {
  permissionModel,
  roleModel,
  rolePermissionModel,
  userRoleModel,
  type PermissionModel,
  type RoleModel,
  type RolePermissionModel,
  type UserRoleModel,
} from "../../../models/index";
import { HttpError } from "../../../utils/http-error.util";
import {
  CRM_PERMISSIONS,
  CRM_ROLE_NAMES,
  CRM_ROLE_PERMISSIONS,
  CRM_ROLE_SLUGS,
} from "./rbac.catalog";

export type CrmSessionRole = {
  id: string;
  name: string;
  slug: string;
};

export type CrmSession = {
  roles: CrmSessionRole[];
  permissions: string[];
};

export class RbacService {
  constructor(
    private readonly permissions: PermissionModel = permissionModel,
    private readonly roles: RoleModel = roleModel,
    private readonly rolePermissions: RolePermissionModel = rolePermissionModel,
    private readonly userRoles: UserRoleModel = userRoleModel,
  ) {}

  async ensureCatalog(actorId: string): Promise<void> {
    if ((await this.permissions.count()) > 0) {
      return;
    }

    for (const permission of CRM_PERMISSIONS) {
      await this.permissions.create({
        code: permission.code,
        name: permission.name,
        createdBy: actorId,
        updatedBy: actorId,
      });
    }

    for (const slug of CRM_ROLE_SLUGS) {
      await this.roles.create({
        name: CRM_ROLE_NAMES[slug],
        slug,
        createdBy: actorId,
        updatedBy: actorId,
      });
    }

    for (const slug of CRM_ROLE_SLUGS) {
      const role = await this.roles.findOne({ slug });
      if (!role) {
        throw new HttpError(500, `CRM role ${slug} is missing after catalog bootstrap`);
      }
      for (const code of CRM_ROLE_PERMISSIONS[slug]) {
        const permission = await this.permissions.findOne({ code });
        if (!permission) {
          throw new HttpError(500, `CRM permission ${code} is missing after catalog bootstrap`);
        }
        await this.rolePermissions.create({
          roleId: role.id,
          permissionId: permission.id,
          createdBy: actorId,
          updatedBy: actorId,
        });
      }
    }
  }

  async ensureFirstAdmin(userId: string): Promise<void> {
    if ((await this.userRoles.count()) > 0) {
      return;
    }

    const admin = await this.roles.findOne({ slug: "admin", isActive: 1 });
    if (!admin) {
      throw new HttpError(500, "CRM admin role is missing");
    }

    await this.userRoles.create({
      userId,
      roleId: admin.id,
      createdBy: userId,
      updatedBy: userId,
    });
  }

  async getSession(userId: string): Promise<CrmSession> {
    const assignments = await this.userRoles.read({ userId, isActive: 1 });
    const roles: CrmSessionRole[] = [];
    const codes = new Set<string>();

    for (const assignment of assignments) {
      const role = await this.roles.readOne({ id: assignment.roleId });
      if (!role || role.isActive !== 1) {
        continue;
      }
      roles.push({ id: role.id, name: role.name, slug: role.slug });
      const grants = await this.rolePermissions.read({
        roleId: role.id,
        isActive: 1,
      });
      for (const grant of grants) {
        const permission = await this.permissions.readOne({ id: grant.permissionId });
        if (permission && permission.isActive === 1) {
          codes.add(permission.code);
        }
      }
    }

    roles.sort((left, right) => left.slug.localeCompare(right.slug));
    return { roles, permissions: [...codes].sort() };
  }

  async listPermissionCodesForUser(userId: string): Promise<string[]> {
    const session = await this.getSession(userId);
    return session.permissions;
  }

  async listRoles() {
    const roles = await this.roles.read({ isActive: 1 }, { orderBy: { slug: "asc" } });
    const result: Array<{
      id: string;
      name: string;
      slug: string;
      permissionIds: string[];
    }> = [];
    for (const role of roles) {
      const grants = await this.rolePermissions.read({
        roleId: role.id,
        isActive: 1,
      });
      result.push({
        id: role.id,
        name: role.name,
        slug: role.slug,
        permissionIds: grants.map((grant) => grant.permissionId),
      });
    }
    return result;
  }

  async listPermissions() {
    return this.permissions.read({ isActive: 1 }, { orderBy: { code: "asc" } });
  }

  async listRoleIdsForUser(userId: string): Promise<string[]> {
    const assignments = await this.userRoles.read({ userId, isActive: 1 });
    return assignments.map((assignment) => assignment.roleId);
  }

  async assertRoleIds(roleIds: string[]): Promise<void> {
    for (const roleId of roleIds) {
      const role = await this.roles.readOne({ id: roleId });
      if (!role || role.isActive !== 1) {
        throw new HttpError(404, "Role not found");
      }
    }
  }

  async assertPermissionIds(permissionIds: string[]): Promise<void> {
    for (const permissionId of permissionIds) {
      const permission = await this.permissions.readOne({ id: permissionId });
      if (!permission || permission.isActive !== 1) {
        throw new HttpError(404, "Permission not found");
      }
    }
  }

  async countActiveAdmins(): Promise<number> {
    const admin = await this.roles.findOne({ slug: "admin", isActive: 1 });
    if (!admin) {
      return 0;
    }
    return this.userRoles.count({ roleId: admin.id, isActive: 1 });
  }

  async userHasAdminRole(userId: string): Promise<boolean> {
    const admin = await this.roles.findOne({ slug: "admin", isActive: 1 });
    if (!admin) {
      return false;
    }
    const assignment = await this.userRoles.findOne({
      userId,
      roleId: admin.id,
      isActive: 1,
    });
    return Boolean(assignment);
  }

  async replaceUserRoles(
    userId: string,
    roleIds: string[],
    actorId: string,
  ): Promise<string[]> {
    await this.assertRoleIds(roleIds);
    const currentlyAdmin = await this.userHasAdminRole(userId);
    const admin = await this.roles.findOne({ slug: "admin", isActive: 1 });
    const nextHasAdmin = Boolean(admin && roleIds.includes(admin.id));
    if (currentlyAdmin && !nextHasAdmin && (await this.countActiveAdmins()) <= 1) {
      throw new HttpError(422, "Cannot remove the last Admin role");
    }

    const existing = await this.userRoles.read({ userId });
    const desired = new Set(roleIds);
    for (const row of existing) {
      if (!desired.has(row.roleId)) {
        await this.userRoles.hardDeleteOne({ id: row.id });
      }
    }
    for (const roleId of roleIds) {
      const found = existing.find((row) => row.roleId === roleId);
      if (!found) {
        await this.userRoles.create({
          userId,
          roleId,
          createdBy: actorId,
          updatedBy: actorId,
        });
      } else if (found.isActive !== 1) {
        await this.userRoles.update(
          { id: found.id },
          {
            isActive: 1,
            deletedAt: null,
            deletedBy: null,
            updatedBy: actorId,
          },
        );
      }
    }
    return this.listRoleIdsForUser(userId);
  }

  async replaceRolePermissions(
    roleId: string,
    permissionIds: string[],
    actorId: string,
  ) {
    const role = await this.roles.readOne({ id: roleId });
    if (!role || role.isActive !== 1) {
      throw new HttpError(404, "Role not found");
    }
    await this.assertPermissionIds(permissionIds);
    await this.rolePermissions.hardDeleteMany({ roleId });
    for (const permissionId of permissionIds) {
      await this.rolePermissions.create({
        roleId,
        permissionId,
        createdBy: actorId,
        updatedBy: actorId,
      });
    }
    const grants = await this.rolePermissions.read({ roleId, isActive: 1 });
    return {
      id: role.id,
      name: role.name,
      slug: role.slug,
      permissionIds: grants.map((grant) => grant.permissionId),
    };
  }
}

export const rbacService = new RbacService();
