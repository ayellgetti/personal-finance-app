import { Router } from "express";
import { asyncHandler } from "../../../middlewares/async-handler.middleware";
import { requirePermission } from "../../../middlewares/require-permission.middleware";
import { validate, validateBody } from "../../../middlewares/request-validate.middleware";
import { roleController } from "./role.controller";
import { createRoleBodySchema, roleIdParamsSchema, updateRoleBodySchema } from "./role.request";

export const roleRouter = Router();

roleRouter.get(
  "/",
  requirePermission("crm.roles.read"),
  asyncHandler(async (req, res) => {
    await roleController.listRoles(req, res);
  }),
);

roleRouter.post(
  "/",
  requirePermission("crm.roles.update"),
  validateBody(createRoleBodySchema),
  asyncHandler(async (req, res) => {
    await roleController.createRole(req, res);
  }),
);

roleRouter.patch(
  "/:id",
  requirePermission("crm.roles.update"),
  validate({ params: roleIdParamsSchema, body: updateRoleBodySchema }),
  asyncHandler(async (req, res) => {
    await roleController.updateRole(req, res);
  }),
);

export const permissionRouter = Router();

permissionRouter.get(
  "/",
  requirePermission("crm.roles.read"),
  asyncHandler(async (req, res) => {
    await roleController.listPermissions(req, res);
  }),
);
