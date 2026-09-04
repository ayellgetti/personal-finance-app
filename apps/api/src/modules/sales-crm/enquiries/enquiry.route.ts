import { Router } from "express";
import { asyncHandler } from "../../../middlewares/async-handler.middleware";
import { requirePermission } from "../../../middlewares/require-permission.middleware";
import { validate, validateBody } from "../../../middlewares/request-validate.middleware";
import { enquiryController } from "./enquiry.controller";
import {
  convertEnquiryBodySchema,
  createEnquiryBodySchema,
  enquiryIdParamsSchema,
  listEnquiriesQuerySchema,
  removeEnquiryBodySchema,
  updateEnquiryBodySchema,
} from "./enquiry.request";

export const enquiryRouter = Router();

enquiryRouter.get(
  "/",
  requirePermission("crm.enquiries.read"),
  validate({ query: listEnquiriesQuerySchema }),
  asyncHandler(async (req, res) => {
    await enquiryController.list(req, res);
  }),
);

enquiryRouter.post(
  "/",
  requirePermission("crm.enquiries.create"),
  validateBody(createEnquiryBodySchema),
  asyncHandler(async (req, res) => {
    await enquiryController.create(req, res);
  }),
);

enquiryRouter.post(
  "/remove",
  requirePermission("crm.enquiries.delete"),
  validateBody(removeEnquiryBodySchema),
  asyncHandler(async (req, res) => {
    await enquiryController.remove(req, res);
  }),
);

enquiryRouter.post(
  "/:id/convert",
  requirePermission("crm.enquiries.convert"),
  validate({ params: enquiryIdParamsSchema, body: convertEnquiryBodySchema }),
  asyncHandler(async (req, res) => {
    await enquiryController.convert(req, res);
  }),
);

enquiryRouter.get(
  "/:id",
  requirePermission("crm.enquiries.read"),
  validate({ params: enquiryIdParamsSchema }),
  asyncHandler(async (req, res) => {
    await enquiryController.getById(req, res);
  }),
);

enquiryRouter.patch(
  "/:id",
  requirePermission("crm.enquiries.update"),
  validate({ params: enquiryIdParamsSchema, body: updateEnquiryBodySchema }),
  asyncHandler(async (req, res) => {
    await enquiryController.update(req, res);
  }),
);
