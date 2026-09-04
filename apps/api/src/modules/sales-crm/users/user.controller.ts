import type { Request, Response } from "express";
import { BaseController } from "../../shared/base/base.controller";
import { currentUserId, requireParamId } from "../crm.http";
import type {
  CreateCrmUserBody,
  ListCrmUsersQuery,
  UpdateCrmUserBody,
} from "./user.request";
import { crmUserService, type CrmUserService } from "./user.service";

export class CrmUserController extends BaseController {
  constructor(private readonly service: CrmUserService = crmUserService) {
    super();
  }

  async list(req: Request, res: Response) {
    const result = await this.service.list(req.query as ListCrmUsersQuery);
    this.sendSuccess(req, res, result, "CRM users retrieved");
  }

  async create(req: Request, res: Response) {
    const user = await this.service.create(
      currentUserId(req),
      req.body as CreateCrmUserBody,
    );
    this.sendSuccess(req, res, { user }, "CRM user created", 201);
  }

  async update(req: Request, res: Response) {
    const user = await this.service.update(
      currentUserId(req),
      requireParamId(req, "User"),
      req.body as UpdateCrmUserBody,
    );
    this.sendSuccess(req, res, { user }, "CRM user updated");
  }
}

export const crmUserController = new CrmUserController();
