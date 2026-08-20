import { Router } from "express";
import { asyncHandler } from "../../../middlewares/async-handler.js";
import { requireAuth } from "../../../middlewares/require-auth.js";
import { validateBody } from "../../../middlewares/validate.js";
import { financialProfileController } from "./financial-profile.controller.js";
import { upsertFinancialProfileBodySchema } from "./financial-profile.request.js";

export const financialProfileRouter = Router();

financialProfileRouter.use(requireAuth);

financialProfileRouter.get(
  "/",
  asyncHandler(async (req, res) => {
    await financialProfileController.get(req, res);
  }),
);

financialProfileRouter.put(
  "/",
  validateBody(upsertFinancialProfileBodySchema),
  asyncHandler(async (req, res) => {
    await financialProfileController.upsert(req, res);
  }),
);
