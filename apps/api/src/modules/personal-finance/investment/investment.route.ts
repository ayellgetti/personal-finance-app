import { Router } from "express";
import { asyncHandler } from "../../../middlewares/async-handler.js";
import { requireAuth } from "../../../middlewares/require-auth.js";
import { validate, validateBody } from "../../../middlewares/validate.js";
import { investmentController } from "./investment.controller.js";
import {
  createInvestmentBodySchema,
  investmentIdParamsSchema,
  listInvestmentsQuerySchema,
  removeInvestmentBodySchema,
  updateInvestmentBodySchema,
} from "./investment.request.js";

export const investmentRouter = Router();

investmentRouter.use(requireAuth);

investmentRouter.get(
  "/",
  validate({ query: listInvestmentsQuerySchema }),
  asyncHandler(async (req, res) => {
    await investmentController.list(req, res);
  }),
);

investmentRouter.post(
  "/",
  validateBody(createInvestmentBodySchema),
  asyncHandler(async (req, res) => {
    await investmentController.create(req, res);
  }),
);

investmentRouter.post(
  "/remove",
  validateBody(removeInvestmentBodySchema),
  asyncHandler(async (req, res) => {
    await investmentController.remove(req, res);
  }),
);

investmentRouter.get(
  "/:id",
  validate({ params: investmentIdParamsSchema }),
  asyncHandler(async (req, res) => {
    await investmentController.getById(req, res);
  }),
);

investmentRouter.patch(
  "/:id",
  validate({ params: investmentIdParamsSchema, body: updateInvestmentBodySchema }),
  asyncHandler(async (req, res) => {
    await investmentController.update(req, res);
  }),
);
