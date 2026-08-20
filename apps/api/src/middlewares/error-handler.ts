import type { ErrorRequestHandler } from "express";
import { setting } from "../config/setting.js";
import { HttpError } from "../lib/http-error.js";
import { failureLogService } from "../modules/shared/logging/failure-log.service.js";
import { Api } from "../utils/api.util.js";

export const errorHandler: ErrorRequestHandler = async (err, req, res, next) => {
  if (res.headersSent) {
    next(err);
    return;
  }

  const isHttpError = err instanceof HttpError;
  const statusCode = isHttpError ? err.status : 500;
  const message = isHttpError ? err.message : "Internal server error";
  const details = isHttpError ? err.details : undefined;
  const stack = err instanceof Error ? err.stack : undefined;

  await failureLogService.record(req, {
    statusCode,
    message: err instanceof Error ? err.message : String(err),
    stack,
    details,
  });

  Api.error(
    req,
    res,
    message,
    statusCode,
    isHttpError || !setting.isProduction ? details : null,
  );
};
