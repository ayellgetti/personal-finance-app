import type { Request, Response } from "express";
import { BaseController } from "../../shared/base/base.controller";
import { currentUserId, requireParamId } from "../crm.http";
import type {
  CreateFollowUpBody,
  ListFollowUpsQuery,
  RemoveFollowUpBody,
  UpdateFollowUpBody,
} from "./follow-up.request";
import { followUpService, type FollowUpService } from "./follow-up.service";

export class FollowUpController extends BaseController {
  constructor(private readonly service: FollowUpService = followUpService) {
    super();
  }

  async list(req: Request, res: Response) {
    const result = await this.service.list(req.query as ListFollowUpsQuery);
    this.sendSuccess(req, res, result, "Follow-ups retrieved");
  }

  async getById(req: Request, res: Response) {
    const followUp = await this.service.getById(requireParamId(req, "Follow-up"));
    this.sendSuccess(req, res, { followUp }, "Follow-up retrieved");
  }

  async create(req: Request, res: Response) {
    const followUp = await this.service.create(
      currentUserId(req),
      req.body as CreateFollowUpBody,
    );
    this.sendSuccess(req, res, { followUp }, "Follow-up created", 201);
  }

  async update(req: Request, res: Response) {
    const followUp = await this.service.update(
      currentUserId(req),
      requireParamId(req, "Follow-up"),
      req.body as UpdateFollowUpBody,
    );
    this.sendSuccess(req, res, { followUp }, "Follow-up updated");
  }

  async remove(req: Request, res: Response) {
    const result = await this.service.remove(
      currentUserId(req),
      req.body as RemoveFollowUpBody,
    );
    this.sendSuccess(req, res, result, "Follow-up removed");
  }
}

export const followUpController = new FollowUpController();
