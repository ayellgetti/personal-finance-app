import { Router } from "express";
import { asyncHandler } from "../../../middlewares/async-handler.middleware";
import { requirePermission } from "../../../middlewares/require-permission.middleware";
import { validate, validateBody } from "../../../middlewares/request-validate.middleware";
import { communicationController } from "./communication.controller";
import {
  createMessageBodySchema,
  createTemplateBodySchema,
  listMessagesQuerySchema,
  listNotificationsQuerySchema,
  listTemplatesQuerySchema,
  messageIdParamsSchema,
  removeMessageBodySchema,
  removeTemplateBodySchema,
  templateIdParamsSchema,
  updateMessageBodySchema,
  updateTemplateBodySchema,
} from "./communication.request";

export const communicationRouter = Router();

communicationRouter.get(
  "/templates",
  requirePermission("crm.communications.read"),
  validate({ query: listTemplatesQuerySchema }),
  asyncHandler(async (req, res) => {
    await communicationController.listTemplates(req, res);
  }),
);

communicationRouter.post(
  "/templates",
  requirePermission("crm.communications.create"),
  validateBody(createTemplateBodySchema),
  asyncHandler(async (req, res) => {
    await communicationController.createTemplate(req, res);
  }),
);

communicationRouter.post(
  "/templates/remove",
  requirePermission("crm.communications.delete"),
  validateBody(removeTemplateBodySchema),
  asyncHandler(async (req, res) => {
    await communicationController.removeTemplate(req, res);
  }),
);

communicationRouter.get(
  "/templates/:id",
  requirePermission("crm.communications.read"),
  validate({ params: templateIdParamsSchema }),
  asyncHandler(async (req, res) => {
    await communicationController.getTemplate(req, res);
  }),
);

communicationRouter.patch(
  "/templates/:id",
  requirePermission("crm.communications.update"),
  validate({ params: templateIdParamsSchema, body: updateTemplateBodySchema }),
  asyncHandler(async (req, res) => {
    await communicationController.updateTemplate(req, res);
  }),
);

communicationRouter.get(
  "/recipients",
  requirePermission("crm.communications.create"),
  asyncHandler(async (req, res) => {
    await communicationController.listRecipients(req, res);
  }),
);

communicationRouter.get(
  "/messages",
  requirePermission("crm.communications.read"),
  validate({ query: listMessagesQuerySchema }),
  asyncHandler(async (req, res) => {
    await communicationController.listMessages(req, res);
  }),
);

communicationRouter.post(
  "/messages",
  requirePermission("crm.communications.create"),
  validateBody(createMessageBodySchema),
  asyncHandler(async (req, res) => {
    await communicationController.createMessage(req, res);
  }),
);

communicationRouter.post(
  "/messages/remove",
  requirePermission("crm.communications.delete"),
  validateBody(removeMessageBodySchema),
  asyncHandler(async (req, res) => {
    await communicationController.removeMessage(req, res);
  }),
);

communicationRouter.post(
  "/messages/:id/cancel",
  requirePermission("crm.communications.update"),
  validate({ params: messageIdParamsSchema }),
  asyncHandler(async (req, res) => {
    await communicationController.cancelMessage(req, res);
  }),
);

communicationRouter.get(
  "/messages/:id",
  requirePermission("crm.communications.read"),
  validate({ params: messageIdParamsSchema }),
  asyncHandler(async (req, res) => {
    await communicationController.getMessage(req, res);
  }),
);

communicationRouter.patch(
  "/messages/:id",
  requirePermission("crm.communications.update"),
  validate({ params: messageIdParamsSchema, body: updateMessageBodySchema }),
  asyncHandler(async (req, res) => {
    await communicationController.updateMessage(req, res);
  }),
);

export const notificationRouter = Router();

notificationRouter.get(
  "/",
  validate({ query: listNotificationsQuerySchema }),
  asyncHandler(async (req, res) => {
    await communicationController.inbox(req, res);
  }),
);

notificationRouter.post(
  "/:id/read",
  validate({ params: messageIdParamsSchema }),
  asyncHandler(async (req, res) => {
    await communicationController.markRead(req, res);
  }),
);
