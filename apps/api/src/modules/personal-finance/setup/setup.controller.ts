import type { Request, Response } from "express";
import { BaseController } from "../../../controller/base.controller.js";
import { HttpError } from "../../../lib/http-error.js";
import type { SetupBody } from "./setup.request.js";
import { setupService } from "./setup.service.js";
import type { SetupService } from "./setup.service.js";

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
}

export const setupController = new SetupController();
