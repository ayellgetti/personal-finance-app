import type { Request, Response } from "express";
import { BaseController } from "../../shared/base/base.controller";
import { currentUserId, requireParamId } from "../crm.http";
import type {
  CreateContactBody,
  ListContactsQuery,
  RemoveContactBody,
  UpdateContactBody,
} from "./contact.request";
import { contactService, type ContactService } from "./contact.service";

export class ContactController extends BaseController {
  constructor(private readonly service: ContactService = contactService) {
    super();
  }

  async list(req: Request, res: Response) {
    const result = await this.service.list(req.query as ListContactsQuery);
    this.sendSuccess(req, res, result, "Contacts retrieved");
  }

  async getById(req: Request, res: Response) {
    const contact = await this.service.getById(requireParamId(req, "Contact"));
    this.sendSuccess(req, res, { contact }, "Contact retrieved");
  }

  async create(req: Request, res: Response) {
    const contact = await this.service.create(
      currentUserId(req),
      req.body as CreateContactBody,
    );
    this.sendSuccess(req, res, { contact }, "Contact created", 201);
  }

  async update(req: Request, res: Response) {
    const contact = await this.service.update(
      currentUserId(req),
      requireParamId(req, "Contact"),
      req.body as UpdateContactBody,
    );
    this.sendSuccess(req, res, { contact }, "Contact updated");
  }

  async remove(req: Request, res: Response) {
    const result = await this.service.remove(
      currentUserId(req),
      req.body as RemoveContactBody,
    );
    this.sendSuccess(req, res, result, "Contact removed");
  }
}

export const contactController = new ContactController();
