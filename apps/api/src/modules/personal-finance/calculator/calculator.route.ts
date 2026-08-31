import { Router } from "express";
import { asyncHandler } from "../../../middlewares/async-handler.middleware";
import { requireAuth } from "../../../middlewares/jwt-auth.middleware";
import {
  validate,
  validateBody,
} from "../../../middlewares/request-validate.middleware";
import { calculatorController } from "./calculator.controller";
import {
  calculatorIdParamsSchema,
  calculatorInputSchema,
  createCalculatorScenarioBodySchema,
  listCalculatorScenariosQuerySchema,
  removeCalculatorScenarioBodySchema,
  updateCalculatorScenarioBodySchema,
} from "./calculator.request";

export const calculatorRouter = Router();

calculatorRouter.use(requireAuth);

calculatorRouter.post(
  "/preview",
  validateBody(calculatorInputSchema),
  (req, res) => {
    calculatorController.preview(req, res);
  },
);

calculatorRouter.get(
  "/",
  validate({ query: listCalculatorScenariosQuerySchema }),
  asyncHandler(async (req, res) => {
    await calculatorController.list(req, res);
  }),
);

calculatorRouter.post(
  "/",
  validateBody(createCalculatorScenarioBodySchema),
  asyncHandler(async (req, res) => {
    await calculatorController.create(req, res);
  }),
);

calculatorRouter.post(
  "/remove",
  validateBody(removeCalculatorScenarioBodySchema),
  asyncHandler(async (req, res) => {
    await calculatorController.remove(req, res);
  }),
);

calculatorRouter.get(
  "/:id",
  validate({ params: calculatorIdParamsSchema }),
  asyncHandler(async (req, res) => {
    await calculatorController.getById(req, res);
  }),
);

calculatorRouter.patch(
  "/:id",
  validate({
    params: calculatorIdParamsSchema,
    body: updateCalculatorScenarioBodySchema,
  }),
  asyncHandler(async (req, res) => {
    await calculatorController.update(req, res);
  }),
);
