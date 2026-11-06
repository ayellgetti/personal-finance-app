import type { Request, Response } from "express";
import { BaseController } from "../../shared/base/base.controller";
import { HttpError } from "../../../utils/http-error.util";
import { parseListCheckInsQuery, type UpsertCheckInBody } from "./check-in.request";
import { checkInService } from "./check-in.service";
import type { CheckInService } from "./check-in.service";

function currentUserId(req: Request): string {
  if (!req.user) {
    throw new HttpError(401, "Unauthenticated");
  }
  return req.user.id;
}

export class CheckInController extends BaseController {
  constructor(private readonly service: CheckInService = checkInService) {
    super();
  }

  async list(req: Request, res: Response) {
    const result = await this.service.list(currentUserId(req), parseListCheckInsQuery(req.query));
    this.sendSuccess(req, res, result, "Check-ins retrieved");
  }

  async upsert(req: Request, res: Response) {
    const checkIn = await this.service.upsert(currentUserId(req), req.body as UpsertCheckInBody);
    this.sendSuccess(req, res, { checkIn }, "Check-in saved");
  }
}

export const checkInController = new CheckInController();
