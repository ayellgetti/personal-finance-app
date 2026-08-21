import { Router } from "express";
import { asyncHandler } from "../../../middlewares/async-handler.middleware";
import { requireAuth } from "../../../middlewares/jwt-auth.middleware";
import { validateBody } from "../../../middlewares/request-validate.middleware";
import { deviceController } from "./device.controller";
import { addDeviceBodySchema, removeDeviceBodySchema } from "./device.request";

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
