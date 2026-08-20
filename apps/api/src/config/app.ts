import type { Server } from "node:http";
import cors from "cors";
import express, { type Express } from "express";
import { setting } from "./setting.js";
import { HttpError } from "../lib/http-error.js";
import { prisma } from "../lib/prisma.js";
import { errorHandler } from "../middlewares/error-handler.js";
import { requestId } from "../middlewares/request-id.js";
import { requestLogger } from "../middlewares/request-logger.js";
import { logger } from "../utils/logger.util.js";
import { route } from "./route.js";

export class App {
  readonly express: Express;
  private server?: Server;

  constructor() {
    this.express = express();
    this.configureMiddleware();
    this.configureRoutes();
    this.configureErrors();
  }

  start(): void {
    this.server = this.express.listen(setting.port, () => {
      logger.info("API started", {
        port: setting.port,
        environment: setting.environment,
      });
    });

    process.once("SIGINT", () => void this.shutdown("SIGINT"));
    process.once("SIGTERM", () => void this.shutdown("SIGTERM"));
    process.on("unhandledRejection", (reason) => {
      logger.error("Unhandled promise rejection", { reason: String(reason) });
    });
    process.on("uncaughtException", (error) => {
      logger.error("Uncaught exception", { message: error.message, stack: error.stack });
      void this.shutdown("uncaughtException", 1);
    });
  }

  private configureMiddleware(): void {
    this.express.use(cors({ origin: setting.corsOrigin }));
    this.express.use(express.json());
    this.express.use(requestId);
    this.express.use(requestLogger);
  }

  private configureRoutes(): void {
    route.mount(this.express);
  }

  private configureErrors(): void {
    this.express.use((req, _res, next) => {
      next(new HttpError(404, `Route not found: ${req.method} ${req.path}`));
    });
    this.express.use(errorHandler);
  }

  private async shutdown(signal: string, exitCode = 0): Promise<void> {
    logger.info("API shutting down", { signal });
    this.server?.close();
    await prisma.$disconnect();
    process.exitCode = exitCode;
  }
}

export const app = new App();
