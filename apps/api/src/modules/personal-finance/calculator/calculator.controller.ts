import type { Request, Response } from "express";
import { BaseController } from "../../shared/base/base.controller";
import { HttpError } from "../../../utils/http-error.util";
import type {
  CalculatorInputBody,
  CreateCalculatorScenarioBody,
  ListCalculatorScenariosQuery,
  RemoveCalculatorScenarioBody,
  UpdateCalculatorScenarioBody,
} from "./calculator.request";
import { calculatorService, type CalculatorService } from "./calculator.service";

function currentUserId(req: Request): string {
  if (!req.user) {
    throw new HttpError(401, "Unauthenticated");
  }
  return req.user.id;
}

export class CalculatorController extends BaseController {
  constructor(private readonly service: CalculatorService = calculatorService) {
    super();
  }

  preview(req: Request, res: Response) {
    const result = this.service.preview(req.body as CalculatorInputBody);
    this.sendSuccess(req, res, { result }, "Calculator result computed");
  }

  async list(req: Request, res: Response) {
    const result = await this.service.list(
      currentUserId(req),
      req.query as ListCalculatorScenariosQuery,
    );
    this.sendSuccess(req, res, result, "Calculator scenarios retrieved");
  }

  async create(req: Request, res: Response) {
    const scenario = await this.service.create(
      currentUserId(req),
      req.body as CreateCalculatorScenarioBody,
    );
    this.sendSuccess(req, res, { scenario }, "Calculator scenario saved", 201);
  }

  async remove(req: Request, res: Response) {
    const result = await this.service.remove(
      currentUserId(req),
      req.body as RemoveCalculatorScenarioBody,
    );
    this.sendSuccess(req, res, result, "Calculator scenario removed");
  }

  async getById(req: Request, res: Response) {
    const id = req.params.id;
    if (typeof id !== "string") {
      throw new HttpError(400, "Calculator scenario id is required");
    }
    const scenario = await this.service.getById(currentUserId(req), id);
    this.sendSuccess(req, res, { scenario }, "Calculator scenario retrieved");
  }

  async update(req: Request, res: Response) {
    const id = req.params.id;
    if (typeof id !== "string") {
      throw new HttpError(400, "Calculator scenario id is required");
    }
    const scenario = await this.service.update(
      currentUserId(req),
      id,
      req.body as UpdateCalculatorScenarioBody,
    );
    this.sendSuccess(req, res, { scenario }, "Calculator scenario updated");
  }
}

export const calculatorController = new CalculatorController();
