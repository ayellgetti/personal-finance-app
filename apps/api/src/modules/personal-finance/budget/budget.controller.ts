import type { Request, Response } from "express";
import { BaseController } from "../../shared/base/base.controller";
import { HttpError } from "../../../utils/http-error.util";
import type {
  CreateBudgetBody,
  ListBudgetsQuery,
  RemoveBudgetBody,
  UpdateBudgetBody,
} from "./budget.request";
import { budgetService } from "./budget.service";
import type { BudgetService } from "./budget.service";

function currentUserId(req: Request): string {
  if (!req.user) {
    throw new HttpError(401, "Unauthenticated");
  }
  return req.user.id;
}

export class BudgetController extends BaseController {
  constructor(private readonly service: BudgetService = budgetService) {
    super();
  }

  async list(req: Request, res: Response) {
    const result = await this.service.list(
      currentUserId(req),
      req.query as ListBudgetsQuery,
    );
    this.sendSuccess(req, res, result, "Budgets retrieved");
  }

  async getById(req: Request, res: Response) {
    const id = req.params.id;
    if (typeof id !== "string") {
      throw new HttpError(400, "Budget id is required");
    }
    const budget = await this.service.getById(currentUserId(req), id);
    this.sendSuccess(req, res, { budget }, "Budget retrieved");
  }

  async create(req: Request, res: Response) {
    const body = req.body as CreateBudgetBody;
    const budget = await this.service.create(currentUserId(req), body);
    this.sendSuccess(req, res, { budget }, "Budget created", 201);
  }

  async update(req: Request, res: Response) {
    const id = req.params.id;
    if (typeof id !== "string") {
      throw new HttpError(400, "Budget id is required");
    }
    const body = req.body as UpdateBudgetBody;
    const budget = await this.service.update(currentUserId(req), id, body);
    this.sendSuccess(req, res, { budget }, "Budget updated");
  }

  async remove(req: Request, res: Response) {
    const body = req.body as RemoveBudgetBody;
    const result = await this.service.remove(currentUserId(req), body);
    this.sendSuccess(req, res, result, "Budget removed");
  }
}

export const budgetController = new BudgetController();
