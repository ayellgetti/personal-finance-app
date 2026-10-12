import type { Request, Response } from "express";
import { BaseController } from "../../shared/base/base.controller";
import { currentUserId, requireParamId } from "../crm.http";
import type {
  CreateInvoiceBody,
  ListInvoicesQuery,
  RemoveInvoiceBody,
  UpdateInvoiceBody,
} from "./invoice.request";
import { invoiceService, type InvoiceService } from "./invoice.service";

export class InvoiceController extends BaseController {
  constructor(private readonly service: InvoiceService = invoiceService) {
    super();
  }

  async list(req: Request, res: Response) {
    const result = await this.service.list(req.query as ListInvoicesQuery);
    this.sendSuccess(req, res, result, "Invoices retrieved");
  }

  async getById(req: Request, res: Response) {
    const invoice = await this.service.getById(requireParamId(req, "Invoice"));
    this.sendSuccess(req, res, { invoice }, "Invoice retrieved");
  }

  async create(req: Request, res: Response) {
    const invoice = await this.service.create(currentUserId(req), req.body as CreateInvoiceBody);
    this.sendSuccess(req, res, { invoice }, "Invoice created", 201);
  }

  async update(req: Request, res: Response) {
    const invoice = await this.service.update(
      currentUserId(req),
      requireParamId(req, "Invoice"),
      req.body as UpdateInvoiceBody,
    );
    this.sendSuccess(req, res, { invoice }, "Invoice updated");
  }

  async remove(req: Request, res: Response) {
    const result = await this.service.remove(currentUserId(req), req.body as RemoveInvoiceBody);
    this.sendSuccess(req, res, result, "Invoice removed");
  }
}

export const invoiceController = new InvoiceController();
