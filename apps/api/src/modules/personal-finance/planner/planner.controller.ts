import type { Request, Response } from "express";
import { BaseController } from "../../shared/base/base.controller";
import { HttpError } from "../../../utils/http-error.util";
import { plannerService } from "./planner.service";
import type { PlannerService } from "./planner.service";

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
