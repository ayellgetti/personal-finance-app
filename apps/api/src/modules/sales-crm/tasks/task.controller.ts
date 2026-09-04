import type { Request, Response } from "express";
import { BaseController } from "../../shared/base/base.controller";
import { currentUserId, requireParamId } from "../crm.http";
import type {
  CreateTaskBody,
  ListTasksQuery,
  RemoveTaskBody,
  UpdateTaskBody,
  UpdateTaskStatusBody,
} from "./task.request";
import { taskService, type TaskService } from "./task.service";

export class TaskController extends BaseController {
  constructor(private readonly service: TaskService = taskService) {
    super();
  }

  async list(req: Request, res: Response) {
    const result = await this.service.list(req.query as ListTasksQuery);
    this.sendSuccess(req, res, result, "Tasks retrieved");
  }

  async getById(req: Request, res: Response) {
    const task = await this.service.getById(requireParamId(req, "Task"));
    this.sendSuccess(req, res, { task }, "Task retrieved");
  }

  async create(req: Request, res: Response) {
    const task = await this.service.create(currentUserId(req), req.body as CreateTaskBody);
    this.sendSuccess(req, res, { task }, "Task created", 201);
  }

  async update(req: Request, res: Response) {
    const task = await this.service.update(
      currentUserId(req),
      requireParamId(req, "Task"),
      req.body as UpdateTaskBody,
    );
    this.sendSuccess(req, res, { task }, "Task updated");
  }

  async updateStatus(req: Request, res: Response) {
    const task = await this.service.updateStatus(
      currentUserId(req),
      requireParamId(req, "Task"),
      req.body as UpdateTaskStatusBody,
    );
    this.sendSuccess(req, res, { task }, "Task status updated");
  }

  async remove(req: Request, res: Response) {
    const result = await this.service.remove(
      currentUserId(req),
      req.body as RemoveTaskBody,
    );
    this.sendSuccess(req, res, result, "Task removed");
  }
}

export const taskController = new TaskController();
