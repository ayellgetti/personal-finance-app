import { Router } from "express";
import { asyncHandler } from "../../../middlewares/async-handler.js";
import { requireAuth } from "../../../middlewares/require-auth.js";
import { advisorController } from "./advisor.controller.js";

export const advisorRouter = Router();

advisorRouter.use(requireAuth);

advisorRouter.post(
  "/report",
  asyncHandler(async (req, res) => {
    await advisorController.report(req, res);
  }),
);
