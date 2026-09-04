import { Router } from "express";
import { asyncHandler } from "../../../middlewares/async-handler.middleware";
import { requirePermission } from "../../../middlewares/require-permission.middleware";
import { validate, validateBody } from "../../../middlewares/request-validate.middleware";
import { followUpController } from "./follow-up.controller";
import {
  createFollowUpBodySchema,
  followUpIdParamsSchema,
  listFollowUpsQuerySchema,
  removeFollowUpBodySchema,
  updateFollowUpBodySchema,
} from "./follow-up.request";

export const followUpRouter = Router();

followUpRouter.get(
  "/",
  requirePermission("crm.followups.read"),
  validate({ query: listFollowUpsQuerySchema }),
  asyncHandler(async (req, res) => {
    await followUpController.list(req, res);
  }),
);

followUpRouter.post(
  "/",
  requirePermission("crm.followups.create"),
  validateBody(createFollowUpBodySchema),
  asyncHandler(async (req, res) => {
    await followUpController.create(req, res);
  }),
);

followUpRouter.post(
  "/remove",
  requirePermission("crm.followups.delete"),
  validateBody(removeFollowUpBodySchema),
  asyncHandler(async (req, res) => {
    await followUpController.remove(req, res);
  }),
);

followUpRouter.get(
  "/:id",
  requirePermission("crm.followups.read"),
  validate({ params: followUpIdParamsSchema }),
  asyncHandler(async (req, res) => {
    await followUpController.getById(req, res);
  }),
);

followUpRouter.patch(
  "/:id",
  requirePermission("crm.followups.update"),
  validate({ params: followUpIdParamsSchema, body: updateFollowUpBodySchema }),
  asyncHandler(async (req, res) => {
    await followUpController.update(req, res);
  }),
);
