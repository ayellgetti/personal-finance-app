import type { Request, Response } from "express";
import { BaseController } from "../../shared/base/base.controller";
import { HttpError } from "../../../utils/http-error.util";
import type { SetupBody } from "./setup.request";
import { setupService } from "./setup.service";
import type { SetupService } from "./setup.service";

function currentUserId(req: Request): string {
  if (!req.user) {
    throw new HttpError(401, "Unauthenticated");
  }
  return req.user.id;
}

export class SetupController extends BaseController {
  constructor(private readonly service: SetupService = setupService) {
    super();
  }

  async complete(req: Request, res: Response) {
    const body = req.body as SetupBody;
    const result = await this.service.complete(currentUserId(req), body);
    this.sendSuccess(req, res, result, "Setup saved", 201);
  }

  async completeQuickStep(req: Request, res: Response) {
    const user = await this.service.completeQuickStep(currentUserId(req));
    this.sendSuccess(req, res, { user }, "Quick setup completed");
  }
}

export const setupController = new SetupController();
