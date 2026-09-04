import type { Request, Response } from "express";
import { BaseController } from "../../shared/base/base.controller";
import { currentUserId, requireParamId } from "../crm.http";
import type {
  ConvertEnquiryBody,
  CreateEnquiryBody,
  ListEnquiriesQuery,
  RemoveEnquiryBody,
  UpdateEnquiryBody,
} from "./enquiry.request";
import { enquiryService, type EnquiryService } from "./enquiry.service";

export class EnquiryController extends BaseController {
  constructor(private readonly service: EnquiryService = enquiryService) {
    super();
  }

  async list(req: Request, res: Response) {
    const result = await this.service.list(req.query as ListEnquiriesQuery);
    this.sendSuccess(req, res, result, "Enquiries retrieved");
  }

  async getById(req: Request, res: Response) {
    const enquiry = await this.service.getById(requireParamId(req, "Enquiry"));
    this.sendSuccess(req, res, { enquiry }, "Enquiry retrieved");
  }

  async create(req: Request, res: Response) {
    const enquiry = await this.service.create(
      currentUserId(req),
      req.body as CreateEnquiryBody,
    );
    this.sendSuccess(req, res, { enquiry }, "Enquiry created", 201);
  }

  async update(req: Request, res: Response) {
    const enquiry = await this.service.update(
      currentUserId(req),
      requireParamId(req, "Enquiry"),
      req.body as UpdateEnquiryBody,
    );
    this.sendSuccess(req, res, { enquiry }, "Enquiry updated");
  }

  async remove(req: Request, res: Response) {
    const result = await this.service.remove(
      currentUserId(req),
      req.body as RemoveEnquiryBody,
    );
    this.sendSuccess(req, res, result, "Enquiry removed");
  }

  async convert(req: Request, res: Response) {
    const result = await this.service.convert(
      currentUserId(req),
      requireParamId(req, "Enquiry"),
      (req.body ?? {}) as ConvertEnquiryBody,
    );
    this.sendSuccess(req, res, result, "Enquiry converted");
  }
}

export const enquiryController = new EnquiryController();
