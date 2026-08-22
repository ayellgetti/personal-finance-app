import type { Request, Response } from "express";
import { BaseController } from "../../shared/base/base.controller";
import { HttpError } from "../../../utils/http-error.util";
import type {
  CreateTaxScenarioBody,
  ListTaxScenariosQuery,
  RemoveTaxScenarioBody,
  TaxPlanInputBody,
  UpdateTaxScenarioBody,
} from "./tax.request";
import { taxService } from "./tax.service";
import type { TaxService } from "./tax.service";

function currentUserId(req: Request): string {
  if (!req.user) {
    throw new HttpError(401, "Unauthenticated");
  }
  return req.user.id;
}

export class TaxController extends BaseController {
  constructor(private readonly service: TaxService = taxService) {
    super();
  }

  catalog(req: Request, res: Response) {
    this.sendSuccess(req, res, this.service.catalog(), "Tax catalog retrieved");
  }

  preview(req: Request, res: Response) {
    const body = req.body as TaxPlanInputBody;
    const result = this.service.preview(body);
    this.sendSuccess(req, res, { result }, "Tax estimate computed");
  }

  async list(req: Request, res: Response) {
    const result = await this.service.list(
      currentUserId(req),
      req.query as ListTaxScenariosQuery,
    );
    this.sendSuccess(req, res, result, "Tax scenarios retrieved");
  }

  async getById(req: Request, res: Response) {
    const id = req.params.id;
    if (typeof id !== "string") {
      throw new HttpError(400, "Tax scenario id is required");
    }
    const scenario = await this.service.getById(currentUserId(req), id);
    this.sendSuccess(req, res, { scenario }, "Tax scenario retrieved");
  }

  async create(req: Request, res: Response) {
    const body = req.body as CreateTaxScenarioBody;
    const scenario = await this.service.create(currentUserId(req), body);
    this.sendSuccess(req, res, { scenario }, "Tax scenario saved", 201);
  }

  async update(req: Request, res: Response) {
    const id = req.params.id;
    if (typeof id !== "string") {
      throw new HttpError(400, "Tax scenario id is required");
    }
    const body = req.body as UpdateTaxScenarioBody;
    const scenario = await this.service.update(currentUserId(req), id, body);
    this.sendSuccess(req, res, { scenario }, "Tax scenario updated");
  }

  async remove(req: Request, res: Response) {
    const body = req.body as RemoveTaxScenarioBody;
    const result = await this.service.remove(currentUserId(req), body);
    this.sendSuccess(req, res, result, "Tax scenario removed");
  }
}

export const taxController = new TaxController();
