import { Router } from "express";
import { asyncHandler } from "../../../middlewares/async-handler.middleware";
import { requirePermission } from "../../../middlewares/require-permission.middleware";
import { dashboardController } from "./dashboard.controller";

export const dashboardRouter = Router();

dashboardRouter.get(
  "/",
  requirePermission("crm.dashboard.read"),
  asyncHandler(async (req, res) => {
    await dashboardController.get(req, res);
  }),
);
