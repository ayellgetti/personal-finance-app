import { Router } from "express";
import { asyncHandler } from "../../../middlewares/async-handler.middleware";
import { requirePermission } from "../../../middlewares/require-permission.middleware";
import { validate, validateBody } from "../../../middlewares/request-validate.middleware";
import { contactController } from "./contact.controller";
import {
  createContactBodySchema,
  contactIdParamsSchema,
  listContactsQuerySchema,
  removeContactBodySchema,
  updateContactBodySchema,
} from "./contact.request";

export const contactRouter = Router();

contactRouter.get(
  "/",
  requirePermission("crm.contacts.read"),
  validate({ query: listContactsQuerySchema }),
  asyncHandler(async (req, res) => {
    await contactController.list(req, res);
  }),
);

contactRouter.post(
  "/",
  requirePermission("crm.contacts.create"),
  validateBody(createContactBodySchema),
  asyncHandler(async (req, res) => {
    await contactController.create(req, res);
  }),
);

contactRouter.post(
  "/remove",
  requirePermission("crm.contacts.delete"),
  validateBody(removeContactBodySchema),
  asyncHandler(async (req, res) => {
    await contactController.remove(req, res);
  }),
);

contactRouter.get(
  "/:id",
  requirePermission("crm.contacts.read"),
  validate({ params: contactIdParamsSchema }),
  asyncHandler(async (req, res) => {
    await contactController.getById(req, res);
  }),
);

contactRouter.patch(
  "/:id",
  requirePermission("crm.contacts.update"),
  validate({ params: contactIdParamsSchema, body: updateContactBodySchema }),
  asyncHandler(async (req, res) => {
    await contactController.update(req, res);
  }),
);
