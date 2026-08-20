import { Router } from "express";
import { asyncHandler } from "../../../middlewares/async-handler.js";
import { requireAuth } from "../../../middlewares/require-auth.js";
import { plannerController } from "./planner.controller.js";

export const plannerRouter = Router();

plannerRouter.use(requireAuth);

plannerRouter.get(
  "/report",
  asyncHandler(async (req, res) => {
    await plannerController.report(req, res);
  }),
);
