import assert from "node:assert/strict";
import test from "node:test";
import type { User } from "@prisma/client";
import { HttpError } from "../utils/http-error.util";
import type { UserModel } from "../models/index";
import type { RbacService } from "../modules/sales-crm/rbac/rbac.service";
import { CrmUserService } from "../modules/sales-crm/users/user.service";
import { resetCrmUserPasswordBodySchema } from "../modules/sales-crm/users/user.request";
import type { UserService } from "../modules/shared/user/user.service";

const staff = {
  id: "user-2",
  isActive: 1,
  firstName: "Grace",
  lastName: "Hopper",
  email: "grace@example.com",
  mobileNo: "+919111122222",
  password: "current-hash",
  oldPasswords: [] as string[],
};

test("password reset body rejects a short password", () => {
  const parsed = resetCrmUserPasswordBodySchema.safeParse({ password: "short" });
  assert.equal(parsed.success, false);
});

test("reset password stores the new password and stamps the actor", async () => {
  const calls: string[] = [];
  const users = {
    async findById(id: string, options?: { includeHidden?: boolean }) {
      assert.equal(id, "user-2");
      calls.push(options?.includeHidden ? "hidden" : "public");
      if (options?.includeHidden) return staff;
      return {
        id: staff.id,
        isActive: staff.isActive,
        firstName: staff.firstName,
        lastName: staff.lastName,
        email: staff.email,
        mobileNo: staff.mobileNo,
      };
    },
    async updateById(id: string, data: { updatedBy?: string }) {
      assert.equal(id, "user-2");
      assert.equal(data.updatedBy, "admin-1");
      calls.push("stamp");
      return staff;
    },
  };
  const passwords = {
    async resetPassword(user: User, password: string) {
      assert.equal(user.id, "user-2");
      assert.equal(password, "fresh-password");
      calls.push("reset");
      return staff;
    },
  };
  const rbac = {
    async listRoleIdsForUser() {
      return ["role-admin"];
    },
  };
  const service = new CrmUserService(
    users as unknown as UserModel,
    rbac as unknown as RbacService,
    passwords as unknown as UserService,
  );

  const result = await service.resetPassword("admin-1", "user-2", "fresh-password");

  assert.deepEqual(calls, ["hidden", "reset", "stamp", "public"]);
  assert.equal(result.id, "user-2");
  assert.deepEqual(result.roleIds, ["role-admin"]);
  assert.equal("password" in result, false);
});

test("reset password for a missing user is 404 and does not change a password", async () => {
  let reset = false;
  const users = {
    async findById() {
      return null;
    },
    async updateById() {
      throw new Error("should not stamp");
    },
  };
  const passwords = {
    async resetPassword() {
      reset = true;
      throw new Error("should not reset");
    },
  };
  const service = new CrmUserService(
    users as unknown as UserModel,
    {} as RbacService,
    passwords as unknown as UserService,
  );

  await assert.rejects(
    () => service.resetPassword("admin-1", "missing", "fresh-password"),
    (error: unknown) => error instanceof HttpError && error.status === 404,
  );
  assert.equal(reset, false);
});

test("a rejected password is not stamped onto the user", async () => {
  let stamped = false;
  const users = {
    async findById() {
      return staff;
    },
    async updateById() {
      stamped = true;
      return staff;
    },
  };
  const passwords = {
    async resetPassword() {
      throw new HttpError(400, "Password was used recently. Choose a different password");
    },
  };
  const service = new CrmUserService(
    users as unknown as UserModel,
    {} as RbacService,
    passwords as unknown as UserService,
  );

  await assert.rejects(
    () => service.resetPassword("admin-1", "user-2", "fresh-password"),
    (error: unknown) => error instanceof HttpError && error.status === 400,
  );
  assert.equal(stamped, false);
});
