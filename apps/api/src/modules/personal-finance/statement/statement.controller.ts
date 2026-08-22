import type { Request, Response } from "express";
import { BaseController } from "../../shared/base/base.controller";
import { HttpError } from "../../../utils/http-error.util";
import type {
  CreateStatementBody,
  ListStatementLinesQuery,
  ListStatementsQuery,
  RemoveStatementBody,
  UpdateStatementLineBody,
} from "./statement.request";
import { statementService, type UploadedStatementFile } from "./statement.service";
import type { StatementService } from "./statement.service";

function currentUserId(req: Request): string {
  if (!req.user) {
    throw new HttpError(401, "Unauthenticated");
  }
  return req.user.id;
}

function uploadedFile(req: Request): UploadedStatementFile | undefined {
  const file = req.file;
  if (!file) {
    return undefined;
  }
  return {
    path: file.path,
    originalname: file.originalname,
  };
}

export class StatementController extends BaseController {
  constructor(private readonly service: StatementService = statementService) {
    super();
  }

  async list(req: Request, res: Response) {
    const result = await this.service.list(
      currentUserId(req),
      req.query as ListStatementsQuery,
    );
    this.sendSuccess(req, res, result, "Statements retrieved");
  }

  async getById(req: Request, res: Response) {
    const id = req.params.id;
    if (typeof id !== "string") {
      throw new HttpError(400, "Statement id is required");
    }
    const statement = await this.service.getById(currentUserId(req), id);
    this.sendSuccess(req, res, { statement }, "Statement retrieved");
  }

  async listLines(req: Request, res: Response) {
    const id = req.params.id;
    if (typeof id !== "string") {
      throw new HttpError(400, "Statement id is required");
    }
    const result = await this.service.listLines(
      currentUserId(req),
      id,
      req.query as ListStatementLinesQuery,
    );
    this.sendSuccess(req, res, result, "Statement lines retrieved");
  }

  async create(req: Request, res: Response) {
    const body = req.body as CreateStatementBody;
    const statement = await this.service.create(currentUserId(req), body, uploadedFile(req));
    this.sendSuccess(req, res, { statement }, "Statement analyzed", 201);
  }

  async updateLine(req: Request, res: Response) {
    const id = req.params.id;
    const lineId = req.params.lineId;
    if (typeof id !== "string" || typeof lineId !== "string") {
      throw new HttpError(400, "Statement line id is required");
    }
    const body = req.body as UpdateStatementLineBody;
    const line = await this.service.updateLine(currentUserId(req), id, lineId, body);
    this.sendSuccess(req, res, { line }, "Statement line updated");
  }

  async remove(req: Request, res: Response) {
    const body = req.body as RemoveStatementBody;
    const result = await this.service.remove(currentUserId(req), body);
    this.sendSuccess(req, res, result, "Statement removed");
  }
}

export const statementController = new StatementController();
