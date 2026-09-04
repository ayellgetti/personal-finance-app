import { Router } from "express";
import { asyncHandler } from "../../../middlewares/async-handler.middleware";
import { requirePermission } from "../../../middlewares/require-permission.middleware";
import { validate, validateBody } from "../../../middlewares/request-validate.middleware";
import { taskController } from "./task.controller";
import {
  createTaskBodySchema,
  listTasksQuerySchema,
  removeTaskBodySchema,
  taskIdParamsSchema,
  updateTaskBodySchema,
  updateTaskStatusBodySchema,
} from "./task.request";

export const taskRouter = Router();

taskRouter.get(
  "/",
  requirePermission("crm.tasks.read"),
  validate({ query: listTasksQuerySchema }),
  asyncHandler(async (req, res) => {
    await taskController.list(req, res);
  }),
);

taskRouter.post(
  "/",
  requirePermission("crm.tasks.create"),
  validateBody(createTaskBodySchema),
  asyncHandler(async (req, res) => {
    await taskController.create(req, res);
  }),
);

taskRouter.post(
  "/remove",
  requirePermission("crm.tasks.delete"),
  validateBody(removeTaskBodySchema),
  asyncHandler(async (req, res) => {
    await taskController.remove(req, res);
  }),
);

taskRouter.patch(
  "/:id/status",
  requirePermission("crm.tasks.update"),
  validate({ params: taskIdParamsSchema, body: updateTaskStatusBodySchema }),
  asyncHandler(async (req, res) => {
    await taskController.updateStatus(req, res);
  }),
);

taskRouter.get(
  "/:id",
  requirePermission("crm.tasks.read"),
  validate({ params: taskIdParamsSchema }),
  asyncHandler(async (req, res) => {
    await taskController.getById(req, res);
  }),
);

taskRouter.patch(
  "/:id",
  requirePermission("crm.tasks.update"),
  validate({ params: taskIdParamsSchema, body: updateTaskBodySchema }),
  asyncHandler(async (req, res) => {
    await taskController.update(req, res);
  }),
);
