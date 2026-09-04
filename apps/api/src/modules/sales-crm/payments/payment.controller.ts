import type { Request, Response } from "express";
import { BaseController } from "../../shared/base/base.controller";
import { currentUserId, requireParamId } from "../crm.http";
import type {
  CreatePaymentBody,
  ListPaymentsQuery,
  RemovePaymentBody,
  UpdatePaymentBody,
} from "./payment.request";
import { paymentService, type PaymentService } from "./payment.service";

export class PaymentController extends BaseController {
  constructor(private readonly service: PaymentService = paymentService) {
    super();
  }

  async list(req: Request, res: Response) {
    const result = await this.service.list(req.query as ListPaymentsQuery);
    this.sendSuccess(req, res, result, "Payments retrieved");
  }

  async getById(req: Request, res: Response) {
    const payment = await this.service.getById(requireParamId(req, "Payment"));
    this.sendSuccess(req, res, { payment }, "Payment retrieved");
  }

  async create(req: Request, res: Response) {
    const payment = await this.service.create(
      currentUserId(req),
      req.body as CreatePaymentBody,
    );
    this.sendSuccess(req, res, { payment }, "Payment created", 201);
  }

  async update(req: Request, res: Response) {
    const payment = await this.service.update(
      currentUserId(req),
      requireParamId(req, "Payment"),
      req.body as UpdatePaymentBody,
    );
    this.sendSuccess(req, res, { payment }, "Payment updated");
  }

  async remove(req: Request, res: Response) {
    const result = await this.service.remove(
      currentUserId(req),
      req.body as RemovePaymentBody,
    );
    this.sendSuccess(req, res, result, "Payment removed");
  }
}

export const paymentController = new PaymentController();
