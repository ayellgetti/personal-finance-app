import type { Request, Response } from "express";
import { BaseController } from "../../shared/base/base.controller";
import { HttpError } from "../../../utils/http-error.util";
import type {
  CreateLoanBody,
  ListLoansQuery,
  RemoveLoanBody,
  UpdateLoanBody,
} from "./loan.request";
import { loanService } from "./loan.service";
import type { LoanService } from "./loan.service";

function currentUserId(req: Request): string {
  if (!req.user) {
    throw new HttpError(401, "Unauthenticated");
  }
  return req.user.id;
}

export class LoanController extends BaseController {
  constructor(private readonly service: LoanService = loanService) {
    super();
  }

  async list(req: Request, res: Response) {
    const result = await this.service.list(
      currentUserId(req),
      req.query as ListLoansQuery,
    );
    this.sendSuccess(req, res, result, "Loans retrieved");
  }

  async getById(req: Request, res: Response) {
    const id = req.params.id;
    if (typeof id !== "string") {
      throw new HttpError(400, "Loan id is required");
    }
    const loan = await this.service.getById(currentUserId(req), id);
    this.sendSuccess(req, res, { loan }, "Loan retrieved");
  }

  async create(req: Request, res: Response) {
    const body = req.body as CreateLoanBody;
    const loan = await this.service.create(currentUserId(req), body);
    this.sendSuccess(req, res, { loan }, "Loan created", 201);
  }

  async update(req: Request, res: Response) {
    const id = req.params.id;
    if (typeof id !== "string") {
      throw new HttpError(400, "Loan id is required");
    }
    const body = req.body as UpdateLoanBody;
    const loan = await this.service.update(currentUserId(req), id, body);
    this.sendSuccess(req, res, { loan }, "Loan updated");
  }

  async remove(req: Request, res: Response) {
    const body = req.body as RemoveLoanBody;
    const result = await this.service.remove(currentUserId(req), body);
    this.sendSuccess(req, res, result, "Loan removed");
  }
}

export const loanController = new LoanController();
