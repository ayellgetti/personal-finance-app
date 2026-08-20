import { Router } from "express";
import { asyncHandler } from "../../../middlewares/async-handler.js";
import { requireAuth } from "../../../middlewares/require-auth.js";
import { validate, validateBody } from "../../../middlewares/validate.js";
import { insuranceController } from "./insurance.controller.js";
import {
  createInsuranceBodySchema,
  insuranceIdParamsSchema,
  listInsurancesQuerySchema,
  removeInsuranceBodySchema,
  updateInsuranceBodySchema,
} from "./insurance.request.js";

export const insuranceRouter = Router();

insuranceRouter.use(requireAuth);

insuranceRouter.get(
  "/",
  validate({ query: listInsurancesQuerySchema }),
  asyncHandler(async (req, res) => {
    await insuranceController.list(req, res);
  }),
);

insuranceRouter.post(
  "/",
  validateBody(createInsuranceBodySchema),
  asyncHandler(async (req, res) => {
    await insuranceController.create(req, res);
  }),
);

insuranceRouter.post(
  "/remove",
  validateBody(removeInsuranceBodySchema),
  asyncHandler(async (req, res) => {
    await insuranceController.remove(req, res);
  }),
);

insuranceRouter.get(
  "/:id",
  validate({ params: insuranceIdParamsSchema }),
  asyncHandler(async (req, res) => {
    await insuranceController.getById(req, res);
  }),
);

insuranceRouter.patch(
  "/:id",
  validate({ params: insuranceIdParamsSchema, body: updateInsuranceBodySchema }),
  asyncHandler(async (req, res) => {
    await insuranceController.update(req, res);
  }),
);
