import { Router } from "express";
import { asyncHandler } from "../../../middlewares/async-handler.middleware";
import { requireAuth } from "../../../middlewares/jwt-auth.middleware";
import { validate, validateBody } from "../../../middlewares/request-validate.middleware";
import { investmentController } from "./investment.controller";
import {
  createInvestmentBodySchema,
  investmentIdParamsSchema,
  listInvestmentsQuerySchema,
  removeInvestmentBodySchema,
  updateInvestmentBodySchema,
} from "./investment.request";

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
