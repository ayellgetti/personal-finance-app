import { Router } from "express";
import { asyncHandler } from "../../../middlewares/async-handler.js";
import { requireAuth } from "../../../middlewares/require-auth.js";
import { validateBody } from "../../../middlewares/validate.js";
import { setupController } from "./setup.controller.js";
import { setupBodySchema } from "./setup.request.js";

export const setupRouter = Router();

setupRouter.use(requireAuth);

setupRouter.post(
  "/",
  validateBody(setupBodySchema),
  asyncHandler(async (req, res) => {
    await setupController.complete(req, res);
  }),
);
