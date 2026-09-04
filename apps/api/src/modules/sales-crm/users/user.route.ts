import { Router } from "express";
import { asyncHandler } from "../../../middlewares/async-handler.middleware";
import { requirePermission } from "../../../middlewares/require-permission.middleware";
import { validate, validateBody } from "../../../middlewares/request-validate.middleware";
import { crmUserController } from "./user.controller";
import {
  createCrmUserBodySchema,
  crmUserIdParamsSchema,
  listCrmUsersQuerySchema,
  updateCrmUserBodySchema,
} from "./user.request";

export const crmUserRouter = Router();

crmUserRouter.get(
  "/",
  requirePermission("crm.users.read"),
  validate({ query: listCrmUsersQuerySchema }),
  asyncHandler(async (req, res) => {
    await crmUserController.list(req, res);
  }),
);

crmUserRouter.post(
  "/",
  requirePermission("crm.users.create"),
  validateBody(createCrmUserBodySchema),
  asyncHandler(async (req, res) => {
    await crmUserController.create(req, res);
  }),
);

crmUserRouter.patch(
  "/:id",
  requirePermission("crm.users.update"),
  validate({ params: crmUserIdParamsSchema, body: updateCrmUserBodySchema }),
  asyncHandler(async (req, res) => {
    await crmUserController.update(req, res);
  }),
);
