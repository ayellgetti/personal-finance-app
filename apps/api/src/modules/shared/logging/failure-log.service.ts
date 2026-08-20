import type { Request } from "express";
import { Prisma } from "@prisma/client";
import { failureLogModel } from "../../../models/index.js";
import { GLOBAL_HIDDEN_FIELDS } from "../../../utils/model.util.js";
import { logger } from "../../../utils/logger.util.js";

const REDACTED_FIELDS = new Set<string>([
  ...GLOBAL_HIDDEN_FIELDS,
  "otp",
  "no",
  "token",
  "accessToken",
  "refreshToken",
]);

export type FailureDetails = {
  statusCode: number;
  message: string;
  stack?: string;
  details?: unknown;
};

export class FailureLogService {
  async record(req: Request, failure: FailureDetails): Promise<void> {
    try {
      await failureLogModel.create({
        requestId: req.requestId,
        method: req.method,
        path: req.originalUrl,
        statusCode: failure.statusCode,
        message: failure.message,
        stack: failure.stack,
        details: this.toJson(failure.details),
        body: this.toJson(this.redact(req.body)),
        userId: req.user?.id,
      });
    } catch (error) {
      logger.error("Could not persist failure log", {
        requestId: req.requestId,
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }

  private redact(value: unknown): unknown {
    if (Array.isArray(value)) {
      return value.map((item) => this.redact(item));
    }

    if (value !== null && typeof value === "object") {
      const record: Record<string, unknown> = {};
      for (const [key, nested] of Object.entries(value)) {
        record[key] = REDACTED_FIELDS.has(key) ? "[redacted]" : this.redact(nested);
      }
      return record;
    }

    return value;
  }

  private toJson(value: unknown): Prisma.InputJsonValue | undefined {
    if (value === undefined) {
      return undefined;
    }

    try {
      return JSON.parse(JSON.stringify(value)) as Prisma.InputJsonValue;
    } catch {
      return { serializationError: "Value was not JSON serializable" };
    }
  }
}

export const failureLogService = new FailureLogService();
