import type { Request, Response } from "express";
import { HttpError } from "../../../utils/http-error.util";
import { BaseController } from "../../shared/base/base.controller";
import { currentUserId, requireParamId } from "../crm.http";
import { parseContactCsv } from "./contact.import";
import type {
  CreateContactBody,
  ImportContactsBody,
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
    const detail = await this.service.getDetail(requireParamId(req, "Contact"));
    this.sendSuccess(req, res, detail, "Contact retrieved");
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

  async import(req: Request, res: Response) {
    const body = req.body as ImportContactsBody;
    const parsed = body.rows?.length
      ? {
          rows: body.rows.map((row, index) => ({ row: index + 1, ...row })),
          skipped: [],
        }
      : parseContactCsv(body.csv ?? "");
    if (parsed.rows.length === 0) {
      throw new HttpError(422, "No contacts to import");
    }
    const result = await this.service.importRows(currentUserId(req), parsed.rows, parsed.skipped);
    this.sendSuccess(req, res, result, "Contacts imported");
  }
}

export const contactController = new ContactController();
