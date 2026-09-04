import { Router } from "express";
import { asyncHandler } from "../../../middlewares/async-handler.middleware";
import { requirePermission } from "../../../middlewares/require-permission.middleware";
import { validate, validateBody } from "../../../middlewares/request-validate.middleware";
import { clientController } from "./client.controller";
import {
  clientIdParamsSchema,
  createClientBodySchema,
  listClientsQuerySchema,
  removeClientBodySchema,
  updateClientBodySchema,
} from "./client.request";

export const clientRouter = Router();

clientRouter.get(
  "/",
  requirePermission("crm.clients.read"),
  validate({ query: listClientsQuerySchema }),
  asyncHandler(async (req, res) => {
    await clientController.list(req, res);
  }),
);

clientRouter.post(
  "/",
  requirePermission("crm.clients.create"),
  validateBody(createClientBodySchema),
  asyncHandler(async (req, res) => {
    await clientController.create(req, res);
  }),
);

clientRouter.post(
  "/remove",
  requirePermission("crm.clients.delete"),
  validateBody(removeClientBodySchema),
  asyncHandler(async (req, res) => {
    await clientController.remove(req, res);
  }),
);

clientRouter.get(
  "/:id",
  requirePermission("crm.clients.read"),
  validate({ params: clientIdParamsSchema }),
  asyncHandler(async (req, res) => {
    await clientController.getById(req, res);
  }),
);

clientRouter.patch(
  "/:id",
  requirePermission("crm.clients.update"),
  validate({ params: clientIdParamsSchema, body: updateClientBodySchema }),
  asyncHandler(async (req, res) => {
    await clientController.update(req, res);
  }),
);
