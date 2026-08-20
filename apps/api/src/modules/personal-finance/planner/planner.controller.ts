import type { Request, Response } from "express";
import { BaseController } from "../../../controller/base.controller.js";
import { HttpError } from "../../../lib/http-error.js";
import { plannerService } from "./planner.service.js";
import type { PlannerService } from "./planner.service.js";

function currentUserId(req: Request): string {
  if (!req.user) {
    throw new HttpError(401, "Unauthenticated");
  }
  return req.user.id;
}

export class PlannerController extends BaseController {
  constructor(private readonly service: PlannerService = plannerService) {
    super();
  }

  async report(req: Request, res: Response) {
    const report = await this.service.report(currentUserId(req));
    this.sendSuccess(req, res, { report }, "Planner report generated");
  }
}

export const plannerController = new PlannerController();
