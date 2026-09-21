import type { Request, Response } from "express";
import { BaseController } from "../../shared/base/base.controller";
import type { CreatePublicEnquiryBody } from "./public-enquiry.request";
import { publicEnquiryService, type PublicEnquiryService } from "./public-enquiry.service";

export class PublicEnquiryController extends BaseController {
  constructor(private readonly service: PublicEnquiryService = publicEnquiryService) {
    super();
  }

  async create(req: Request, res: Response) {
    const result = await this.service.submit(req.body as CreatePublicEnquiryBody);
    this.sendSuccess(req, res, result, "Enquiry submitted", 201);
  }
}

export const publicEnquiryController = new PublicEnquiryController();
