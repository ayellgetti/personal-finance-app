import type { Request, Response } from "express";
import { BaseController } from "../../../controller/base.controller.js";
import { HttpError } from "../../../lib/http-error.js";
import type { UpsertFinancialProfileBody } from "./financial-profile.request.js";
import {
  financialProfileService,
  type FinancialProfileService,
} from "./financial-profile.service.js";

function currentUserId(req: Request): string {
  if (!req.user) {
    throw new HttpError(401, "Unauthenticated");
  }
  return req.user.id;
}

export class FinancialProfileController extends BaseController {
  constructor(private readonly service: FinancialProfileService = financialProfileService) {
    super();
  }

  async get(req: Request, res: Response) {
    const financialProfile = await this.service.getByUserId(currentUserId(req));
    this.sendSuccess(req, res, { financialProfile }, "Financial profile retrieved");
  }

  async upsert(req: Request, res: Response) {
    const body = req.body as UpsertFinancialProfileBody;
    const financialProfile = await this.service.upsert(currentUserId(req), body);
    this.sendSuccess(req, res, { financialProfile }, "Financial profile saved");
  }
}

export const financialProfileController = new FinancialProfileController();
