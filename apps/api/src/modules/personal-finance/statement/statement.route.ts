import { Router } from "express";
import { asyncHandler } from "../../../middlewares/async-handler.middleware";
import { requireAuth } from "../../../middlewares/jwt-auth.middleware";
import { validate, validateBody } from "../../../middlewares/request-validate.middleware";
import { uploadSingle } from "../../../middlewares/upload.middleware";
import { statementController } from "./statement.controller";
import {
  createStatementBodySchema,
  listStatementLinesQuerySchema,
  listStatementsQuerySchema,
  removeStatementBodySchema,
  statementIdParamsSchema,
  updateStatementLineBodySchema,
} from "./statement.request";
import { z } from "zod";

const lineParamsSchema = z.object({
  id: z.string().uuid(),
  lineId: z.string().uuid(),
});

export const statementRouter = Router();

statementRouter.use(requireAuth);

statementRouter.get(
  "/",
  validate({ query: listStatementsQuerySchema }),
  asyncHandler(async (req, res) => {
    await statementController.list(req, res);
  }),
);

statementRouter.post(
  "/",
  validateBody(createStatementBodySchema),
  asyncHandler(async (req, res) => {
    await statementController.create(req, res);
  }),
);

statementRouter.post(
  "/upload",
  uploadSingle("file"),
  validateBody(createStatementBodySchema),
  asyncHandler(async (req, res) => {
    await statementController.create(req, res);
  }),
);

statementRouter.post(
  "/remove",
  validateBody(removeStatementBodySchema),
  asyncHandler(async (req, res) => {
    await statementController.remove(req, res);
  }),
);

statementRouter.get(
  "/:id/lines",
  validate({ params: statementIdParamsSchema, query: listStatementLinesQuerySchema }),
  asyncHandler(async (req, res) => {
    await statementController.listLines(req, res);
  }),
);

statementRouter.patch(
  "/:id/lines/:lineId",
  validate({ params: lineParamsSchema, body: updateStatementLineBodySchema }),
  asyncHandler(async (req, res) => {
    await statementController.updateLine(req, res);
  }),
);

statementRouter.get(
  "/:id",
  validate({ params: statementIdParamsSchema }),
  asyncHandler(async (req, res) => {
    await statementController.getById(req, res);
  }),
);
