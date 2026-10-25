import { Router } from "express";
import { asyncHandler } from "../../../middlewares/async-handler.middleware";
import {
  requireAnyPermission,
  requirePermission,
} from "../../../middlewares/require-permission.middleware";
import { validateBody } from "../../../middlewares/request-validate.middleware";
import { companyController } from "./company.controller";
import { updateCompanyBodySchema } from "./company.request";

export const companyRouter = Router();

companyRouter.get(
  "/",
  requireAnyPermission("crm.company.read", "crm.invoices.read"),
  asyncHandler(async (req, res) => {
    await companyController.get(req, res);
  }),
);

companyRouter.put(
  "/",
  requirePermission("crm.company.update"),
  validateBody(updateCompanyBodySchema),
  asyncHandler(async (req, res) => {
    await companyController.update(req, res);
  }),
);
