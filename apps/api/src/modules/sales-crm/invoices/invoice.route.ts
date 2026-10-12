import { Router } from "express";
import { asyncHandler } from "../../../middlewares/async-handler.middleware";
import { requirePermission } from "../../../middlewares/require-permission.middleware";
import { validate, validateBody } from "../../../middlewares/request-validate.middleware";
import { invoiceController } from "./invoice.controller";
import {
  createInvoiceBodySchema,
  invoiceIdParamsSchema,
  listInvoicesQuerySchema,
  removeInvoiceBodySchema,
  updateInvoiceBodySchema,
} from "./invoice.request";

export const invoiceRouter = Router();

invoiceRouter.get(
  "/",
  requirePermission("crm.invoices.read"),
  validate({ query: listInvoicesQuerySchema }),
  asyncHandler(async (req, res) => {
    await invoiceController.list(req, res);
  }),
);

invoiceRouter.post(
  "/",
  requirePermission("crm.invoices.create"),
  validateBody(createInvoiceBodySchema),
  asyncHandler(async (req, res) => {
    await invoiceController.create(req, res);
  }),
);

invoiceRouter.post(
  "/remove",
  requirePermission("crm.invoices.delete"),
  validateBody(removeInvoiceBodySchema),
  asyncHandler(async (req, res) => {
    await invoiceController.remove(req, res);
  }),
);

invoiceRouter.get(
  "/:id",
  requirePermission("crm.invoices.read"),
  validate({ params: invoiceIdParamsSchema }),
  asyncHandler(async (req, res) => {
    await invoiceController.getById(req, res);
  }),
);

invoiceRouter.patch(
  "/:id",
  requirePermission("crm.invoices.update"),
  validate({ params: invoiceIdParamsSchema, body: updateInvoiceBodySchema }),
  asyncHandler(async (req, res) => {
    await invoiceController.update(req, res);
  }),
);
