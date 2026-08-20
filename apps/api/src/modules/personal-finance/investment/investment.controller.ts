import type { Request, Response } from "express";
import { BaseController } from "../../../controller/base.controller.js";
import { HttpError } from "../../../lib/http-error.js";
import type {
  CreateInvestmentBody,
  ListInvestmentsQuery,
  RemoveInvestmentBody,
  UpdateInvestmentBody,
} from "./investment.request.js";
import { investmentService } from "./investment.service.js";
import type { InvestmentService } from "./investment.service.js";

function currentUserId(req: Request): string {
  if (!req.user) {
    throw new HttpError(401, "Unauthenticated");
  }
  return req.user.id;
}

export class InvestmentController extends BaseController {
  constructor(private readonly service: InvestmentService = investmentService) {
    super();
  }

  async list(req: Request, res: Response) {
    const result = await this.service.list(
      currentUserId(req),
      req.query as ListInvestmentsQuery,
    );
    this.sendSuccess(req, res, result, "Investments retrieved");
  }

  async getById(req: Request, res: Response) {
    const id = req.params.id;
    if (typeof id !== "string") {
      throw new HttpError(400, "Investment id is required");
    }
    const investment = await this.service.getById(currentUserId(req), id);
    this.sendSuccess(req, res, { investment }, "Investment retrieved");
  }

  async create(req: Request, res: Response) {
    const body = req.body as CreateInvestmentBody;
    const investment = await this.service.create(currentUserId(req), body);
    this.sendSuccess(req, res, { investment }, "Investment created", 201);
  }

  async update(req: Request, res: Response) {
    const id = req.params.id;
    if (typeof id !== "string") {
      throw new HttpError(400, "Investment id is required");
    }
    const body = req.body as UpdateInvestmentBody;
    const investment = await this.service.update(currentUserId(req), id, body);
    this.sendSuccess(req, res, { investment }, "Investment updated");
  }

  async remove(req: Request, res: Response) {
    const body = req.body as RemoveInvestmentBody;
    const result = await this.service.remove(currentUserId(req), body);
    this.sendSuccess(req, res, result, "Investment removed");
  }
}

export const investmentController = new InvestmentController();
