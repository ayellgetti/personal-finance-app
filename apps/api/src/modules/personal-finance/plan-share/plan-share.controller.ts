import type { Request, Response } from "express";
import { BaseController } from "../../shared/base/base.controller";
import { HttpError } from "../../../utils/http-error.util";
import type { CreatePlanShareBody, RemovePlanShareBody } from "./plan-share.request";
import { planShareService } from "./plan-share.service";
import type { PlanShareService } from "./plan-share.service";

function currentUserId(req: Request): string {
  if (!req.user) {
    throw new HttpError(401, "Unauthenticated");
  }
  return req.user.id;
}

export class PlanShareController extends BaseController {
  constructor(private readonly service: PlanShareService = planShareService) {
    super();
  }

  async list(req: Request, res: Response) {
    this.sendSuccess(req, res, await this.service.list(currentUserId(req)), "Share links retrieved");
  }

  async create(req: Request, res: Response) {
    const result = await this.service.create(currentUserId(req), req.body as CreatePlanShareBody);
    this.sendSuccess(req, res, result, "Share link created", 201);
  }

  async revoke(req: Request, res: Response) {
    const result = await this.service.revoke(currentUserId(req), req.body as RemovePlanShareBody);
    this.sendSuccess(req, res, result, "Share link revoked");
  }

  /** Public. Never cached or indexed, and the page that calls it sends no referrer. */
  async view(req: Request, res: Response) {
    const token = req.params.token;
    if (typeof token !== "string") {
      throw new HttpError(404, "This link is no longer available");
    }
    const result = await this.service.view(token);
    res.setHeader("Cache-Control", "no-store");
    res.setHeader("X-Robots-Tag", "noindex, nofollow");
    this.sendSuccess(req, res, result, "Shared plan retrieved");
  }
}

export const planShareController = new PlanShareController();
