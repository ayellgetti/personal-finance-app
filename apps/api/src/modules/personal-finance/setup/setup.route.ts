import { Router } from "express";
import { asyncHandler } from "../../../middlewares/async-handler.middleware";
import { requireAuth } from "../../../middlewares/jwt-auth.middleware";
import { validateBody } from "../../../middlewares/request-validate.middleware";
import { setupController } from "./setup.controller";
import { setupBodySchema } from "./setup.request";

export const setupRouter = Router();

setupRouter.use(requireAuth);

setupRouter.post(
  "/",
  validateBody(setupBodySchema),
  asyncHandler(async (req, res) => {
    await setupController.complete(req, res);
  }),
);
