import { Router } from "express";
import { asyncHandler } from "../../../middlewares/async-handler.middleware";
import { requireAuth } from "../../../middlewares/jwt-auth.middleware";
import { advisorController } from "./advisor.controller";

export const advisorRouter = Router();

advisorRouter.use(requireAuth);

advisorRouter.post(
  "/report",
  asyncHandler(async (req, res) => {
    await advisorController.report(req, res);
  }),
);
