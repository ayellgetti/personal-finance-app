import type { Request, Response } from "express";
import { BaseController } from "../../../controller/base.controller.js";
import { HttpError } from "../../../lib/http-error.js";
import type {
  CreateInsuranceBody,
  ListInsurancesQuery,
  RemoveInsuranceBody,
  UpdateInsuranceBody,
} from "./insurance.request.js";
import { insuranceService } from "./insurance.service.js";
import type { InsuranceService } from "./insurance.service.js";

function currentUserId(req: Request): string {
  if (!req.user) {
    throw new HttpError(401, "Unauthenticated");
  }
  return req.user.id;
}

export class InsuranceController extends BaseController {
  constructor(private readonly service: InsuranceService = insuranceService) {
    super();
  }

  async list(req: Request, res: Response) {
    const result = await this.service.list(
      currentUserId(req),
      req.query as ListInsurancesQuery,
    );
    this.sendSuccess(req, res, result, "Insurances retrieved");
  }

  async getById(req: Request, res: Response) {
    const id = req.params.id;
    if (typeof id !== "string") {
      throw new HttpError(400, "Insurance id is required");
    }
    const insurance = await this.service.getById(currentUserId(req), id);
    this.sendSuccess(req, res, { insurance }, "Insurance retrieved");
  }

  async create(req: Request, res: Response) {
    const body = req.body as CreateInsuranceBody;
    const insurance = await this.service.create(currentUserId(req), body);
    this.sendSuccess(req, res, { insurance }, "Insurance created", 201);
  }

  async update(req: Request, res: Response) {
    const id = req.params.id;
    if (typeof id !== "string") {
      throw new HttpError(400, "Insurance id is required");
    }
    const body = req.body as UpdateInsuranceBody;
    const insurance = await this.service.update(currentUserId(req), id, body);
    this.sendSuccess(req, res, { insurance }, "Insurance updated");
  }

  async remove(req: Request, res: Response) {
    const body = req.body as RemoveInsuranceBody;
    const result = await this.service.remove(currentUserId(req), body);
    this.sendSuccess(req, res, result, "Insurance removed");
  }
}

export const insuranceController = new InsuranceController();
