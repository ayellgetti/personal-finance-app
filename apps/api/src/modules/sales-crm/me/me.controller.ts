import type { Request, Response } from "express";
import { BaseController } from "../../shared/base/base.controller";
import { HttpError } from "../../../utils/http-error.util";
import { meService, type MeService } from "./me.service";

function currentUserId(req: Request): string {
  if (!req.user) {
    throw new HttpError(401, "Unauthenticated");
  }
  return req.user.id;
}

export class MeController extends BaseController {
  constructor(private readonly service: MeService = meService) {
    super();
  }

  async me(req: Request, res: Response) {
    const result = await this.service.getMe(currentUserId(req));
    this.sendSuccess(req, res, result, "Current CRM session retrieved");
  }
}

export const meController = new MeController();
