import { Router } from "express";
import { asyncHandler } from "../../../middlewares/async-handler.js";
import { requireAuth } from "../../../middlewares/require-auth.js";
import { validate, validateBody } from "../../../middlewares/validate.js";
import { goalController } from "./goal.controller.js";
import {
  createGoalBodySchema,
  goalIdParamsSchema,
  listGoalsQuerySchema,
  removeGoalBodySchema,
  updateGoalBodySchema,
} from "./goal.request.js";

export const goalRouter = Router();

goalRouter.use(requireAuth);

goalRouter.get(
  "/",
  validate({ query: listGoalsQuerySchema }),
  asyncHandler(async (req, res) => {
    await goalController.list(req, res);
  }),
);

goalRouter.post(
  "/",
  validateBody(createGoalBodySchema),
  asyncHandler(async (req, res) => {
    await goalController.create(req, res);
  }),
);

goalRouter.post(
  "/remove",
  validateBody(removeGoalBodySchema),
  asyncHandler(async (req, res) => {
    await goalController.remove(req, res);
  }),
);

goalRouter.get(
  "/:id",
  validate({ params: goalIdParamsSchema }),
  asyncHandler(async (req, res) => {
    await goalController.getById(req, res);
  }),
);

goalRouter.patch(
  "/:id",
  validate({ params: goalIdParamsSchema, body: updateGoalBodySchema }),
  asyncHandler(async (req, res) => {
    await goalController.update(req, res);
  }),
);
