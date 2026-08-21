import { Router } from "express";
import { asyncHandler } from "../../../middlewares/async-handler.middleware";
import { requireAuth } from "../../../middlewares/jwt-auth.middleware";
import { plannerController } from "./planner.controller";

export const plannerRouter = Router();

plannerRouter.use(requireAuth);

plannerRouter.get(
  "/report",
  asyncHandler(async (req, res) => {
    await plannerController.report(req, res);
  }),
);
