import type { Request, Response } from "express";
import { BaseController } from "../../shared/base/base.controller";
import { HttpError } from "../../../utils/http-error.util";
import {
  advisorService,
  type AdvisorService,
} from "./advisor.service";

function currentUserId(req: Request): string {
  if (!req.user) {
    throw new HttpError(401, "Unauthenticated");
  }
  return req.user.id;
}

export class AdvisorController extends BaseController {
  constructor(private readonly service: AdvisorService = advisorService) {
    super();
  }

  async report(req: Request, res: Response): Promise<void> {
    const refresh =
      req.query.refresh === "1" ||
      req.query.refresh === "true" ||
      req.query.refresh === "yes";
    const result = await this.service.report(
      currentUserId(req),
      req.requestId,
      { refresh },
    );
    this.sendSuccess(
      req,
      res,
      result,
      result.source === "cache"
        ? "Saved AI advisor report loaded"
        : "AI financial advisor report generated",
    );
  }
}

export const advisorController = new AdvisorController();
