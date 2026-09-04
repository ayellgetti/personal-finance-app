import { Router } from "express";
import { asyncHandler } from "../../../middlewares/async-handler.middleware";
import { requirePermission } from "../../../middlewares/require-permission.middleware";
import { validate, validateBody } from "../../../middlewares/request-validate.middleware";
import { paymentController } from "./payment.controller";
import {
  createPaymentBodySchema,
  listPaymentsQuerySchema,
  paymentIdParamsSchema,
  removePaymentBodySchema,
  updatePaymentBodySchema,
} from "./payment.request";

export const paymentRouter = Router();

paymentRouter.get(
  "/",
  requirePermission("crm.payments.read"),
  validate({ query: listPaymentsQuerySchema }),
  asyncHandler(async (req, res) => {
    await paymentController.list(req, res);
  }),
);

paymentRouter.post(
  "/",
  requirePermission("crm.payments.create"),
  validateBody(createPaymentBodySchema),
  asyncHandler(async (req, res) => {
    await paymentController.create(req, res);
  }),
);

paymentRouter.post(
  "/remove",
  requirePermission("crm.payments.delete"),
  validateBody(removePaymentBodySchema),
  asyncHandler(async (req, res) => {
    await paymentController.remove(req, res);
  }),
);

paymentRouter.get(
  "/:id",
  requirePermission("crm.payments.read"),
  validate({ params: paymentIdParamsSchema }),
  asyncHandler(async (req, res) => {
    await paymentController.getById(req, res);
  }),
);

paymentRouter.patch(
  "/:id",
  requirePermission("crm.payments.update"),
  validate({ params: paymentIdParamsSchema, body: updatePaymentBodySchema }),
  asyncHandler(async (req, res) => {
    await paymentController.update(req, res);
  }),
);
