import { Router } from "express";
import { asyncHandler } from "../../../middlewares/async-handler.middleware";
import { requireAuth } from "../../../middlewares/jwt-auth.middleware";
import { validate, validateBody } from "../../../middlewares/request-validate.middleware";
import { budgetController } from "./budget.controller";
import {
  budgetIdParamsSchema,
  createBudgetBodySchema,
  listBudgetsQuerySchema,
  removeBudgetBodySchema,
  updateBudgetBodySchema,
} from "./budget.request";

export const budgetRouter = Router();

budgetRouter.use(requireAuth);

budgetRouter.get(
  "/",
  validate({ query: listBudgetsQuerySchema }),
  asyncHandler(async (req, res) => {
    await budgetController.list(req, res);
  }),
);

budgetRouter.post(
  "/",
  validateBody(createBudgetBodySchema),
  asyncHandler(async (req, res) => {
    await budgetController.create(req, res);
  }),
);

budgetRouter.post(
  "/remove",
  validateBody(removeBudgetBodySchema),
  asyncHandler(async (req, res) => {
    await budgetController.remove(req, res);
  }),
);

budgetRouter.get(
  "/:id",
  validate({ params: budgetIdParamsSchema }),
  asyncHandler(async (req, res) => {
    await budgetController.getById(req, res);
  }),
);

budgetRouter.patch(
  "/:id",
  validate({ params: budgetIdParamsSchema, body: updateBudgetBodySchema }),
  asyncHandler(async (req, res) => {
    await budgetController.update(req, res);
  }),
);
