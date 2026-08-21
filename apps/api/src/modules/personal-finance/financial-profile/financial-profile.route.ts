import { Router } from "express";
import { asyncHandler } from "../../../middlewares/async-handler.middleware";
import { requireAuth } from "../../../middlewares/jwt-auth.middleware";
import { validateBody } from "../../../middlewares/request-validate.middleware";
import { financialProfileController } from "./financial-profile.controller";
import { upsertFinancialProfileBodySchema } from "./financial-profile.request";

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
