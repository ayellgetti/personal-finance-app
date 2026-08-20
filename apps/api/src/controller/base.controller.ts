import type { Request, Response } from "express";
import { Api } from "../utils/api.util.js";

export abstract class BaseController {
  protected sendSuccess<T>(
    req: Request,
    res: Response,
    data: T,
    message = "Success",
    statusCode = 200,
  ): Response {
    return Api.success(req, res, data, message, statusCode);
  }
}
