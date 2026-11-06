import type { Request, Response } from "express";
import { BaseController } from "../../shared/base/base.controller";
import { HttpError } from "../../../utils/http-error.util";
import type { CreateFreedomScenarioBody, RemoveFreedomScenarioBody } from "./freedom-scenario.request";
import { freedomScenarioService } from "./freedom-scenario.service";
import type { FreedomScenarioService } from "./freedom-scenario.service";

function currentUserId(req: Request): string {
  if (!req.user) {
    throw new HttpError(401, "Unauthenticated");
  }
  return req.user.id;
}

export class FreedomScenarioController extends BaseController {
  constructor(private readonly service: FreedomScenarioService = freedomScenarioService) {
    super();
  }

  async list(req: Request, res: Response) {
    const result = await this.service.list(currentUserId(req));
    this.sendSuccess(req, res, result, "Saved what-ifs retrieved");
  }

  async create(req: Request, res: Response) {
    const scenario = await this.service.create(currentUserId(req), req.body as CreateFreedomScenarioBody);
    this.sendSuccess(req, res, { scenario }, "What-if saved", 201);
  }

  async remove(req: Request, res: Response) {
    const result = await this.service.remove(currentUserId(req), req.body as RemoveFreedomScenarioBody);
    this.sendSuccess(req, res, result, "What-if removed");
  }
}

export const freedomScenarioController = new FreedomScenarioController();
