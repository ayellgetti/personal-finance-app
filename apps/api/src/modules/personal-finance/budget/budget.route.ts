import { Router } from "express";
import { asyncHandler } from "../../../middlewares/async-handler.js";
import { requireAuth } from "../../../middlewares/require-auth.js";
import { validate, validateBody } from "../../../middlewares/validate.js";
import { budgetController } from "./budget.controller.js";
import {
  budgetIdParamsSchema,
  createBudgetBodySchema,
  listBudgetsQuerySchema,
  removeBudgetBodySchema,
  updateBudgetBodySchema,
} from "./budget.request.js";

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
