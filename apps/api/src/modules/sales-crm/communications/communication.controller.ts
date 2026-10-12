import type { Request, Response } from "express";
import { BaseController } from "../../shared/base/base.controller";
import { currentUserId, requireParamId } from "../crm.http";
import type {
  CreateMessageBody,
  CreateTemplateBody,
  ListMessagesQuery,
  ListNotificationsQuery,
  ListTemplatesQuery,
  RemoveMessageBody,
  RemoveTemplateBody,
  UpdateMessageBody,
  UpdateTemplateBody,
} from "./communication.request";
import { communicationService, type CommunicationService } from "./communication.service";

export class CommunicationController extends BaseController {
  constructor(private readonly service: CommunicationService = communicationService) {
    super();
  }

  async listTemplates(req: Request, res: Response) {
    const result = await this.service.listTemplates(req.query as ListTemplatesQuery);
    this.sendSuccess(req, res, result, "Templates retrieved");
  }

  async getTemplate(req: Request, res: Response) {
    const template = await this.service.getTemplate(requireParamId(req, "Template"));
    this.sendSuccess(req, res, { template }, "Template retrieved");
  }

  async createTemplate(req: Request, res: Response) {
    const template = await this.service.createTemplate(currentUserId(req), req.body as CreateTemplateBody);
    this.sendSuccess(req, res, { template }, "Template created", 201);
  }

  async updateTemplate(req: Request, res: Response) {
    const template = await this.service.updateTemplate(
      currentUserId(req),
      requireParamId(req, "Template"),
      req.body as UpdateTemplateBody,
    );
    this.sendSuccess(req, res, { template }, "Template updated");
  }

  async removeTemplate(req: Request, res: Response) {
    const result = await this.service.removeTemplate(currentUserId(req), req.body as RemoveTemplateBody);
    this.sendSuccess(req, res, result, "Template removed");
  }

  async listRecipients(req: Request, res: Response) {
    const result = await this.service.listRecipients();
    this.sendSuccess(req, res, result, "Recipients retrieved");
  }

  async listMessages(req: Request, res: Response) {
    const result = await this.service.listMessages(req.query as ListMessagesQuery);
    this.sendSuccess(req, res, result, "Messages retrieved");
  }

  async getMessage(req: Request, res: Response) {
    const message = await this.service.getMessage(requireParamId(req, "Message"));
    this.sendSuccess(req, res, { message }, "Message retrieved");
  }

  async createMessage(req: Request, res: Response) {
    const message = await this.service.createMessage(currentUserId(req), req.body as CreateMessageBody);
    this.sendSuccess(req, res, { message }, "Message saved", 201);
  }

  async updateMessage(req: Request, res: Response) {
    const message = await this.service.updateMessage(
      currentUserId(req),
      requireParamId(req, "Message"),
      req.body as UpdateMessageBody,
    );
    this.sendSuccess(req, res, { message }, "Message updated");
  }

  async cancelMessage(req: Request, res: Response) {
    const message = await this.service.cancelMessage(currentUserId(req), requireParamId(req, "Message"));
    this.sendSuccess(req, res, { message }, "Message cancelled");
  }

  async removeMessage(req: Request, res: Response) {
    const result = await this.service.removeMessage(currentUserId(req), req.body as RemoveMessageBody);
    this.sendSuccess(req, res, result, "Message removed");
  }

  async inbox(req: Request, res: Response) {
    const result = await this.service.inbox(currentUserId(req), req.query as ListNotificationsQuery);
    this.sendSuccess(req, res, result, "Notifications retrieved");
  }

  async markRead(req: Request, res: Response) {
    const message = await this.service.markRead(currentUserId(req), requireParamId(req, "Notification"));
    this.sendSuccess(req, res, { message }, "Notification marked read");
  }
}

export const communicationController = new CommunicationController();
