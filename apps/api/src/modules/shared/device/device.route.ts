import { Router } from "express";
import { asyncHandler } from "../../../middlewares/async-handler.js";
import { requireAuth } from "../../../middlewares/require-auth.js";
import { validateBody } from "../../../middlewares/validate.js";
import { deviceController } from "./device.controller.js";
import { addDeviceBodySchema, removeDeviceBodySchema } from "./device.request.js";

export const deviceRouter = Router();

deviceRouter.use(requireAuth);

deviceRouter.post(
  "/add",
  validateBody(addDeviceBodySchema),
  asyncHandler(async (req, res) => {
    await deviceController.add(req, res);
  }),
);

deviceRouter.post(
  "/remove",
  validateBody(removeDeviceBodySchema),
  asyncHandler(async (req, res) => {
    await deviceController.remove(req, res);
  }),
);
