import type { Request, Response } from "express";
import { logger } from "./logger.util";

export type ApiResponse<T> = {
  code: number;
  success: boolean;
  data: T;
  message: string;
  timestamp: string;
  requestId: string;
  metadata?: Record<string, unknown>;
};

export class Api {
  static success<T>(
    req: Request,
    res: Response,
    data: T,
    message = "Success",
    statusCode = 200,
    metadata?: Record<string, unknown>,
  ): Response<ApiResponse<T>> {
    const body: ApiResponse<T> = {
      code: statusCode,
      success: true,
      data,
      message,
      timestamp: new Date().toISOString(),
      requestId: req.requestId,
      ...(metadata ? { metadata } : {}),
    };

    return res.status(statusCode).json(body);
  }

  static error(
    req: Request,
    res: Response,
    message: string,
    statusCode: number,
    data: unknown = null,
  ): Response<ApiResponse<unknown>> {
    logger.error("API request failed", {
      requestId: req.requestId,
      method: req.method,
      path: req.originalUrl,
      statusCode,
      userId: req.user?.id,
      message,
    });

    return res.status(statusCode).json({
      code: statusCode,
      success: false,
      data,
      message,
      timestamp: new Date().toISOString(),
      requestId: req.requestId,
    });
  }
}
