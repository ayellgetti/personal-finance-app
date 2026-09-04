import assert from "node:assert/strict";
import test from "node:test";
import type { Request, Response } from "express";
import { HttpError } from "../utils/http-error.util";
import { createRequirePermission } from "../middlewares/require-permission.middleware";
import {
  CRM_ROLE_PERMISSIONS,
} from "../modules/sales-crm/rbac/rbac.catalog";
import { RbacService } from "../modules/sales-crm/rbac/rbac.service";
import type {
  PermissionModel,
  RoleModel,
  RolePermissionModel,
  UserRoleModel,
} from "../models/index";
import { RoleService } from "../modules/sales-crm/roles/role.service";
import { fakeCrud } from "./crm-test-utils";

async function statusOf(
  handler: ReturnType<ReturnType<typeof createRequirePermission>>,
  req: Request,
) {
  return new Promise<number>((resolve, reject) => {
    handler(req, {} as Response, (error) => {
      if (error instanceof HttpError) {
        resolve(error.status);
        return;
      }
      if (error) {
        reject(error);
        return;
      }
      resolve(200);
    });
  });
}

test("sales cannot PATCH roles", async () => {
  const requirePermission = createRequirePermission(async () => [
    ...CRM_ROLE_PERMISSIONS.sales,
  ]);
  const status = await statusOf(requirePermission("crm.roles.update"), {
    user: { id: "sales-1", email: "sales@example.com" },
  } as Request);
  assert.equal(status, 403);
});

test("viewer cannot create contacts", async () => {
  const requirePermission = createRequirePermission(async () => [
    ...CRM_ROLE_PERMISSIONS.viewer,
  ]);
  const status = await statusOf(requirePermission("crm.contacts.create"), {
    user: { id: "viewer-1", email: "viewer@example.com" },
  } as Request);
  assert.equal(status, 403);
});

test("convert without permission is 403", async () => {
  const requirePermission = createRequirePermission(async () => [
    ...CRM_ROLE_PERMISSIONS.viewer,
  ]);
  const status = await statusOf(requirePermission("crm.enquiries.convert"), {
    user: { id: "viewer-1", email: "viewer@example.com" },
  } as Request);
  assert.equal(status, 403);
});

function rbacHarness() {
  const permissions = fakeCrud("perm", [
    { id: "p-read", code: "crm.roles.read", name: "View roles", isActive: 1 },
    { id: "p-update", code: "crm.roles.update", name: "Update roles", isActive: 1 },
  ]);
  const roles = fakeCrud("role", [
    { id: "role-admin", name: "Admin", slug: "admin", isActive: 1 },
    { id: "role-sales", name: "Sales", slug: "sales", isActive: 1 },
  ]);
  const rolePermissions = fakeCrud("rp", [
    { id: "rp-1", roleId: "role-admin", permissionId: "p-read", isActive: 1 },
    { id: "rp-2", roleId: "role-admin", permissionId: "p-update", isActive: 1 },
  ]);
  const userRoles = fakeCrud("ur", [
    { id: "ur-1", userId: "admin-1", roleId: "role-admin", isActive: 1 },
  ]);
  const rbac = new RbacService(
    permissions.model as unknown as PermissionModel,
    roles.model as unknown as RoleModel,
    rolePermissions.model as unknown as RolePermissionModel,
    userRoles.model as unknown as UserRoleModel,
  );
  return { rbac, permissions, roles, rolePermissions, userRoles };
}

test("last admin cannot remove own admin role", async () => {
  const { rbac } = rbacHarness();
  await assert.rejects(
    () => rbac.replaceUserRoles("admin-1", ["role-sales"], "admin-1"),
    (error: unknown) => error instanceof HttpError && error.status === 422,
  );
});

test("replacing role permissions swaps the grant set", async () => {
  const { rbac, rolePermissions } = rbacHarness();
  const service = new RoleService(rbac);
  const updated = await service.updateRole("admin-1", "role-admin", {
    permissionIds: ["p-read"],
  });
  assert.deepEqual(updated.permissionIds, ["p-read"]);
  assert.equal(rolePermissions.rows.length, 1);
});
