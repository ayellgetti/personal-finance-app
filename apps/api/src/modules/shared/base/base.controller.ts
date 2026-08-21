import { existsSync, unlinkSync } from "node:fs";
import type { Request, Response } from "express";
import type { ZodIssue } from "zod";
import { Api } from "../../../utils/api.util";
import { logger } from "../../../utils/logger.util";
import type { PaginatedResult } from "../../../utils/model.util";

export enum HttpStatusCode {
  OK = 200,
  CREATED = 201,
  BAD_REQUEST = 400,
  UNAUTHORIZED = 401,
  FORBIDDEN = 403,
  NOT_FOUND = 404,
  CONFLICT = 409,
  INTERNAL_SERVER = 500,
}

export type PaginationParams = {
  page: number;
  limit: number;
  skip: number;
  sortBy: string;
  sortOrder: "asc" | "desc";
};

export type UploadedFile = {
  filename: string;
  path: string;
  mimetype: string;
  size: number;
};

export type BatchResult<TSuccess, TFailed = TSuccess> = {
  success: TSuccess[];
  failed: TFailed[];
};

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function queryString(value: unknown): string | undefined {
  return typeof value === "string" && value.length > 0 ? value : undefined;
}

export abstract class BaseController {
  protected sendSuccess<T>(
    req: Request,
    res: Response,
    data: T,
    message = "Success",
    statusCode: number = HttpStatusCode.OK,
  ): Response {
    return Api.success(req, res, data, message, statusCode);
  }

  protected sendError(
    req: Request,
    res: Response,
    errorMessage: string,
    errorCode: number = HttpStatusCode.INTERNAL_SERVER,
    errorData: unknown = null,
  ): Response {
    return Api.error(req, res, errorMessage, errorCode, errorData);
  }

  protected getPaginationParams(req: Request): PaginationParams {
    const page = Math.max(1, Number.parseInt(queryString(req.query.page) ?? "1", 10) || 1);
    const limit = Math.min(
      100,
      Math.max(1, Number.parseInt(queryString(req.query.limit) ?? "10", 10) || 10),
    );
    const sortBy = queryString(req.query.sortBy) ?? "createdAt";
    const sortOrder = queryString(req.query.sortOrder) === "asc" ? "asc" : "desc";

    return {
      page,
      limit,
      skip: (page - 1) * limit,
      sortBy,
      sortOrder,
    };
  }

  protected formatPaginatedResponse<T>(
    data: T[],
    total: number,
    page: number,
    limit: number,
  ): PaginatedResult<T> {
    const safePage = Math.max(1, page);
    const safeLimit = Math.min(100, Math.max(1, limit));
    const totalPages = Math.ceil(total / safeLimit) || 0;

    return {
      items: data,
      pagination: {
        total,
        page: safePage,
        limit: safeLimit,
        totalPages,
        hasNextPage: safePage < totalPages,
        hasPreviousPage: safePage > 1,
      },
    };
  }

  protected validateId(id: string): boolean {
    return UUID_PATTERN.test(id);
  }

  protected deleteFile(filePath: string): boolean {
    try {
      if (!existsSync(filePath)) {
        return false;
      }
      unlinkSync(filePath);
      return true;
    } catch (error) {
      logger.error("File delete failed", {
        message: error instanceof Error ? error.message : String(error),
      });
      return false;
    }
  }

  protected getSortOptions(req: Request): Record<string, "asc" | "desc"> {
    const sortField = queryString(req.query.sortField) ?? queryString(req.query.sortBy) ?? "createdAt";
    const sortOrder = queryString(req.query.sortOrder) === "asc" ? "asc" : "desc";
    return { [sortField]: sortOrder };
  }

  protected getSearchQuery(
    req: Request,
    searchFields: string[],
  ): { OR: Array<Record<string, { contains: string; mode: "insensitive" }>> } | undefined {
    const searchTerm = queryString(req.query.search);
    if (!searchTerm || searchFields.length === 0) {
      return undefined;
    }

    return {
      OR: searchFields.map((field) => ({
        [field]: { contains: searchTerm, mode: "insensitive" as const },
      })),
    };
  }

  protected handleFileUploadResponse(
    req: Request,
    res: Response,
    file: UploadedFile | undefined,
  ): Response {
    if (!file) {
      return this.sendError(req, res, "File upload failed", HttpStatusCode.BAD_REQUEST);
    }

    return this.sendSuccess(
      req,
      res,
      {
        filename: file.filename,
        path: file.path,
        mimetype: file.mimetype,
        size: file.size,
      },
      "File uploaded successfully",
    );
  }

  protected formatValidationErrors(issues: ZodIssue[]): { errors: Array<{ field: string; message: string }> } {
    return {
      errors: issues.map((issue) => ({
        field: issue.path.map(String).join(".") || "(root)",
        message: issue.message,
      })),
    };
  }

  protected handleBatchResponse<TSuccess, TFailed>(results: BatchResult<TSuccess, TFailed>) {
    return {
      successful: results.success.length,
      failed: results.failed.length,
      successItems: results.success,
      failedItems: results.failed,
    };
  }

  protected formatErrorForLogging(error: unknown, req: Request): Record<string, unknown> {
    const err = error instanceof Error ? error : new Error(String(error));
    return {
      timestamp: new Date().toISOString(),
      requestId: req.requestId,
      path: req.path,
      method: req.method,
      message: err.message,
      code: "code" in err && typeof err.code === "string" ? err.code : undefined,
      userId: req.user?.id,
    };
  }
}
