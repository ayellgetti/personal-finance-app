import type { Request, Response } from "express";
import { BaseController } from "../../shared/base/base.controller";
import { HttpError } from "../../../utils/http-error.util";
import {
  advisorChatService,
  type AdvisorChatService,
} from "./advisor-chat.service";
import type { AdvisorChatBody } from "./advisor-chat.request";

function currentUserId(req: Request): string {
  if (!req.user) {
    throw new HttpError(401, "Unauthenticated");
  }
  return req.user.id;
}

export class AdvisorChatController extends BaseController {
  constructor(private readonly service: AdvisorChatService = advisorChatService) {
    super();
  }

  async chat(req: Request, res: Response): Promise<void> {
    const result = await this.service.chat(
      currentUserId(req),
      req.body as AdvisorChatBody,
      req.requestId,
    );
    this.sendSuccess(req, res, result, "AI advisor response ready");
  }
}

export const advisorChatController = new AdvisorChatController();
