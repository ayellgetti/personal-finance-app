import { Router } from "express";
import { asyncHandler } from "../../../middlewares/async-handler.middleware";
import { requireAuth } from "../../../middlewares/jwt-auth.middleware";
import { validateBody } from "../../../middlewares/request-validate.middleware";
import { freedomScenarioController } from "./freedom-scenario.controller";
import {
  createFreedomScenarioBodySchema,
  removeFreedomScenarioBodySchema,
} from "./freedom-scenario.request";

export const freedomScenarioRouter = Router();

freedomScenarioRouter.use(requireAuth);

freedomScenarioRouter.get(
  "/",
  asyncHandler(async (req, res) => {
    await freedomScenarioController.list(req, res);
  }),
);

freedomScenarioRouter.post(
  "/",
  validateBody(createFreedomScenarioBodySchema),
  asyncHandler(async (req, res) => {
    await freedomScenarioController.create(req, res);
  }),
);

freedomScenarioRouter.post(
  "/remove",
  validateBody(removeFreedomScenarioBodySchema),
  asyncHandler(async (req, res) => {
    await freedomScenarioController.remove(req, res);
  }),
);
