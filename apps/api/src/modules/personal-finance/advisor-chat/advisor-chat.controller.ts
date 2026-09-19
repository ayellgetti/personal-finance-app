import type { Request, Response } from "express";
import { BaseController } from "../../shared/base/base.controller";
import { HttpError } from "../../../utils/http-error.util";
import {
  advisorChatService,
  type AdvisorChatService,
} from "./advisor-chat.service";
import type {
  AdvisorChatBody,
  ListAdvisorChatsQuery,
  RemoveAdvisorChatBody,
} from "./advisor-chat.request";

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

  async list(req: Request, res: Response): Promise<void> {
    const result = await this.service.list(
      currentUserId(req),
      req.query as ListAdvisorChatsQuery,
    );
    this.sendSuccess(req, res, result, "AI chats retrieved");
  }

  async getById(req: Request, res: Response): Promise<void> {
    const id = req.params.id;
    if (typeof id !== "string") {
      throw new HttpError(400, "Chat id is required");
    }
    const conversation = await this.service.getById(currentUserId(req), id);
    this.sendSuccess(req, res, { conversation }, "AI chat retrieved");
  }

  async chat(req: Request, res: Response): Promise<void> {
    const result = await this.service.chat(
      currentUserId(req),
      req.body as AdvisorChatBody,
      req.requestId,
    );
    this.sendSuccess(req, res, result, "AI advisor response ready");
  }

  async remove(req: Request, res: Response): Promise<void> {
    const result = await this.service.remove(
      currentUserId(req),
      req.body as RemoveAdvisorChatBody,
    );
    this.sendSuccess(req, res, result, "AI chat removed");
  }
}

export const advisorChatController = new AdvisorChatController();
