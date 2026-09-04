import assert from "node:assert/strict";
import test from "node:test";
import type { Request, Response } from "express";
import { HttpError } from "../utils/http-error.util";
import type {
  PermissionModel,
  RoleModel,
  RolePermissionModel,
  UserRoleModel,
} from "../models/index";
import { createRequirePermission } from "../middlewares/require-permission.middleware";
import {
  CRM_PERMISSION_CODES,
  CRM_ROLE_PERMISSIONS,
  CRM_ROLE_SLUGS,
  crmPermissionCodeSchema,
  crmRoleSlugSchema,
} from "../modules/sales-crm/rbac/rbac.catalog";
import { RbacService } from "../modules/sales-crm/rbac/rbac.service";
import { MeService } from "../modules/sales-crm/me/me.service";
import type { PublicUser } from "../models/index";

type FakePermission = {
  id: string;
  code: string;
  name: string;
  isActive: number;
};

type FakeRole = {
  id: string;
  name: string;
  slug: string;
  isActive: number;
};

type FakeRolePermission = {
  id: string;
  roleId: string;
  permissionId: string;
  isActive: number;
};

type FakeUserRole = {
  id: string;
  userId: string;
  roleId: string;
  isActive: number;
};

function publicUser(id: string): PublicUser {
  const now = new Date("2026-01-01T00:00:00.000Z");
  return {
    id,
    firstName: "Ada",
    lastName: "Lovelace",
    dob: now,
    gender: "female",
    countryCode: "+91",
    mobileNo: "9876543210",
    email: `${id}@example.com`,
    avatar: null,
    avatarBackground: null,
    entryData: null,
    quickStep: 0,
    aiReportCount: 0,
    aiReportLimit: 1,
    isActive: 1,
    createdBy: null,
    createdAt: now,
    updatedBy: null,
    updatedAt: now,
    deletedBy: null,
    deletedAt: null,
  };
}

function fakeRbac() {
  const permissions: FakePermission[] = [];
  const roles: FakeRole[] = [];
  const rolePermissions: FakeRolePermission[] = [];
  const userRoles: FakeUserRole[] = [];

  const permissionModel = {
    async count() {
      return permissions.length;
    },
    async create(data: { code: string; name: string; createdBy?: string; updatedBy?: string }) {
      const created: FakePermission = {
        id: `perm-${permissions.length + 1}`,
        code: data.code,
        name: data.name,
        isActive: 1,
      };
      permissions.push(created);
      return created;
    },
    async findOne(where: { code?: string }) {
      return permissions.find((row) => row.code === where.code) ?? null;
    },
    async readOne(where: { id: string }) {
      return permissions.find((row) => row.id === where.id) ?? null;
    },
  };

  const roleModel = {
    async create(data: { name: string; slug: string; createdBy?: string; updatedBy?: string }) {
      const created: FakeRole = {
        id: `role-${roles.length + 1}`,
        name: data.name,
        slug: data.slug,
        isActive: 1,
      };
      roles.push(created);
      return created;
    },
    async findOne(where: { slug?: string; isActive?: number }) {
      return (
        roles.find(
          (row) =>
            (where.slug === undefined || row.slug === where.slug) &&
            (where.isActive === undefined || row.isActive === where.isActive),
        ) ?? null
      );
    },
    async readOne(where: { id: string }) {
      return roles.find((row) => row.id === where.id) ?? null;
    },
  };

  const rolePermissionModel = {
    async create(data: {
      roleId: string;
      permissionId: string;
      createdBy?: string;
      updatedBy?: string;
    }) {
      const created: FakeRolePermission = {
        id: `rp-${rolePermissions.length + 1}`,
        roleId: data.roleId,
        permissionId: data.permissionId,
        isActive: 1,
      };
      rolePermissions.push(created);
      return created;
    },
    async read(where: { roleId?: string; isActive?: number } = {}) {
      return rolePermissions.filter(
        (row) =>
          (where.roleId === undefined || row.roleId === where.roleId) &&
          (where.isActive === undefined || row.isActive === where.isActive),
      );
    },
  };

  const userRoleModel = {
    async count() {
      return userRoles.length;
    },
    async create(data: {
      userId: string;
      roleId: string;
      createdBy?: string;
      updatedBy?: string;
    }) {
      const created: FakeUserRole = {
        id: `ur-${userRoles.length + 1}`,
        userId: data.userId,
        roleId: data.roleId,
        isActive: 1,
      };
      userRoles.push(created);
      return created;
    },
    async read(where: { userId?: string; isActive?: number } = {}) {
      return userRoles.filter(
        (row) =>
          (where.userId === undefined || row.userId === where.userId) &&
          (where.isActive === undefined || row.isActive === where.isActive),
      );
    },
  };

  const rbac = new RbacService(
    permissionModel as unknown as PermissionModel,
    roleModel as unknown as RoleModel,
    rolePermissionModel as unknown as RolePermissionModel,
    userRoleModel as unknown as UserRoleModel,
  );

  return { rbac, permissions, roles, rolePermissions, userRoles };
}

test("CRM permission catalog has unique codes and valid role maps", () => {
  assert.equal(new Set(CRM_PERMISSION_CODES).size, CRM_PERMISSION_CODES.length);
  for (const code of CRM_PERMISSION_CODES) {
    assert.equal(crmPermissionCodeSchema.parse(code), code);
  }
  assert.equal(crmPermissionCodeSchema.safeParse("crm.roles.delete").success, false);
  for (const slug of CRM_ROLE_SLUGS) {
    assert.equal(crmRoleSlugSchema.parse(slug), slug);
    for (const code of CRM_ROLE_PERMISSIONS[slug]) {
      assert.ok(CRM_PERMISSION_CODES.includes(code));
    }
  }
});

test("default CRM roles match admin / manager / sales / viewer grants", () => {
  assert.deepEqual([...CRM_ROLE_PERMISSIONS.admin], [...CRM_PERMISSION_CODES]);
  assert.ok(!CRM_ROLE_PERMISSIONS.manager.includes("crm.roles.update"));
  assert.equal(
    CRM_ROLE_PERMISSIONS.manager.length,
    CRM_PERMISSION_CODES.length - 1,
  );
  assert.ok(CRM_ROLE_PERMISSIONS.sales.includes("crm.dashboard.read"));
  assert.ok(CRM_ROLE_PERMISSIONS.sales.includes("crm.enquiries.convert"));
  assert.ok(!CRM_ROLE_PERMISSIONS.sales.includes("crm.users.read"));
  assert.ok(!CRM_ROLE_PERMISSIONS.sales.includes("crm.roles.read"));
  for (const code of CRM_ROLE_PERMISSIONS.viewer) {
    assert.ok(code.endsWith(".read"));
  }
  assert.ok(CRM_ROLE_PERMISSIONS.viewer.includes("crm.users.read"));
  assert.ok(CRM_ROLE_PERMISSIONS.viewer.includes("crm.roles.read"));
});

test("empty roles: first /me caller becomes admin; second user is not auto-admin", async () => {
  const { rbac, userRoles } = fakeRbac();
  const users = {
    getById: async (id: string) => publicUser(id),
  };
  const service = new MeService(rbac, users);

  const first = await service.getMe("user-1");
  assert.equal(first.user.id, "user-1");
  assert.deepEqual(
    first.roles.map((role) => role.slug),
    ["admin"],
  );
  assert.ok(first.permissions.includes("crm.roles.update"));
  assert.equal(userRoles.length, 1);
  assert.equal(userRoles[0]?.userId, "user-1");

  const second = service.getMe("user-2");
  await assert.rejects(
    second,
    (error: unknown) => error instanceof HttpError && error.status === 403,
  );
  assert.equal(userRoles.length, 1);
});

test("authenticated user with no CRM role is 403 after bootstrap already happened", async () => {
  const { rbac } = fakeRbac();
  const users = {
    getById: async (id: string) => publicUser(id),
  };
  const service = new MeService(rbac, users);

  await service.getMe("user-1");
  await assert.rejects(
    () => service.getMe("user-2"),
    (error: unknown) => error instanceof HttpError && error.status === 403,
  );
});

test("catalog bootstrap is skipped when Permission is not empty", async () => {
  const { rbac, permissions, roles } = fakeRbac();
  await rbac.ensureCatalog("user-1");
  const permissionCount = permissions.length;
  const roleCount = roles.length;
  await rbac.ensureCatalog("user-2");
  assert.equal(permissions.length, permissionCount);
  assert.equal(roles.length, roleCount);
});

test("requirePermission returns 403 when the request cache lacks the code", async () => {
  const requirePermission = createRequirePermission(async () => ["crm.contacts.read"]);
  const handler = requirePermission("crm.contacts.create");
  const req = {
    user: { id: "user-1", email: "user-1@example.com" },
  } as Request;
  const res = {} as Response;

  const status = await new Promise<number>((resolve, reject) => {
    handler(req, res, (error) => {
      if (error instanceof HttpError) {
        resolve(error.status);
        return;
      }
      reject(error ?? new Error("expected HttpError"));
    });
  });

  assert.equal(status, 403);
  assert.deepEqual(req.crmPermissionCodes, ["crm.contacts.read"]);
});

test("requirePermission caches codes on the request and allows a granted code", async () => {
  let loads = 0;
  const requirePermission = createRequirePermission(async () => {
    loads += 1;
    return ["crm.dashboard.read"];
  });
  const handler = requirePermission("crm.dashboard.read");
  const req = {
    user: { id: "user-1", email: "user-1@example.com" },
  } as Request;
  const res = {} as Response;

  await new Promise<void>((resolve, reject) => {
    handler(req, res, (error) => {
      if (error) {
        reject(error);
        return;
      }
      resolve();
    });
  });
  await new Promise<void>((resolve, reject) => {
    handler(req, res, (error) => {
      if (error) {
        reject(error);
        return;
      }
      resolve();
    });
  });

  assert.equal(loads, 1);
});

test("requirePermission returns 401 without an authenticated user", async () => {
  const requirePermission = createRequirePermission(async () => []);
  const handler = requirePermission("crm.dashboard.read");
  const req = {} as Request;
  const res = {} as Response;

  const status = await new Promise<number>((resolve, reject) => {
    handler(req, res, (error) => {
      if (error instanceof HttpError) {
        resolve(error.status);
        return;
      }
      reject(error ?? new Error("expected HttpError"));
    });
  });

  assert.equal(status, 401);
});

