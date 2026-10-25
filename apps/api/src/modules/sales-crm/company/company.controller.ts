import type { Request, Response } from "express";
import { BaseController } from "../../shared/base/base.controller";
import { currentUserId } from "../crm.http";
import type { UpdateCompanyBody } from "./company.request";
import { companyService, type CompanyService } from "./company.service";

export class CompanyController extends BaseController {
  constructor(private readonly service: CompanyService = companyService) {
    super();
  }

  async get(req: Request, res: Response) {
    const profile = await this.service.get();
    this.sendSuccess(req, res, profile, "Company profile retrieved");
  }

  async update(req: Request, res: Response) {
    const profile = await this.service.update(currentUserId(req), req.body as UpdateCompanyBody);
    this.sendSuccess(req, res, profile, "Company profile saved");
  }
}

export const companyController = new CompanyController();
