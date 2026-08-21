import type { Request, Response } from "express";
import { BaseController } from "../../shared/base/base.controller";
import { HttpError } from "../../../utils/http-error.util";
import type {
  CreateGoalBody,
  ListGoalsQuery,
  RemoveGoalBody,
  UpdateGoalBody,
} from "./goal.request";
import { goalService } from "./goal.service";
import type { GoalService } from "./goal.service";

function currentUserId(req: Request): string {
  if (!req.user) {
    throw new HttpError(401, "Unauthenticated");
  }
  return req.user.id;
}

export class GoalController extends BaseController {
  constructor(private readonly service: GoalService = goalService) {
    super();
  }

  async list(req: Request, res: Response) {
    const result = await this.service.list(
      currentUserId(req),
      req.query as ListGoalsQuery,
    );
    this.sendSuccess(req, res, result, "Goals retrieved");
  }

  async getById(req: Request, res: Response) {
    const id = req.params.id;
    if (typeof id !== "string") {
      throw new HttpError(400, "Goal id is required");
    }
    const goal = await this.service.getById(currentUserId(req), id);
    this.sendSuccess(req, res, { goal }, "Goal retrieved");
  }

  async create(req: Request, res: Response) {
    const body = req.body as CreateGoalBody;
    const goal = await this.service.create(currentUserId(req), body);
    this.sendSuccess(req, res, { goal }, "Goal created", 201);
  }

  async update(req: Request, res: Response) {
    const id = req.params.id;
    if (typeof id !== "string") {
      throw new HttpError(400, "Goal id is required");
    }
    const body = req.body as UpdateGoalBody;
    const goal = await this.service.update(currentUserId(req), id, body);
    this.sendSuccess(req, res, { goal }, "Goal updated");
  }

  async remove(req: Request, res: Response) {
    const body = req.body as RemoveGoalBody;
    const result = await this.service.remove(currentUserId(req), body);
    this.sendSuccess(req, res, result, "Goal removed");
  }
}

export const goalController = new GoalController();
