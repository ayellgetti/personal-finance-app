import type { Server } from "node:http";
import cors from "cors";
import express, { type Express } from "express";
import { setting } from "./setting";
import { errorHandler } from "../middlewares/error-handler.middleware";
import { HttpError } from "../utils/http-error.util";
import { prisma } from "../utils/prisma.util";
import { logger } from "../utils/logger.util";
import { closeRedis } from "../utils/redis.util";
import { route } from "./route";
import { middleware } from "./middleware";
import { util } from "./util";
import { rbacService } from "../modules/sales-crm/rbac/rbac.service";

export class App {
  private static instance?: App;
  readonly express: Express;
  private server?: Server;
  private shutdownPromise?: Promise<void>;

  private constructor() {
    this.express = express();
    this.initialize();
  }

  static getInstance(): App {
    if (!App.instance) {
      App.instance = new App();
    }

    return App.instance;
  }

  private initialize(): void {
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

    void rbacService.ensureCatalog("system").catch((error: unknown) => {
      logger.error("CRM RBAC catalog bootstrap failed", {
        message: error instanceof Error ? error.message : String(error),
      });
    });

    util.registerProcessHandlers((signal: string, exitCode: number) =>
      this.shutdown(signal, exitCode),
    );
  }

  private configureMiddleware(): void {
    this.express.use(cors({ origin: setting.corsOrigin }));
    this.express.use(express.json());
    middleware.mount(this.express);
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

  private shutdown(signal: string, exitCode = 0): Promise<void> {
    if (!this.shutdownPromise) {
      this.shutdownPromise = this.performShutdown(signal, exitCode);
    }

    return this.shutdownPromise;
  }

  private async performShutdown(signal: string, exitCode: number): Promise<void> {
    logger.info("API shutting down", { signal });

    try {
      await this.closeServer();
      await Promise.all([prisma.$disconnect(), closeRedis()]);
    } catch (error) {
      logger.error("API shutdown failed", {
        signal,
        message: error instanceof Error ? error.message : String(error),
      });
      process.exitCode = 1;
      return;
    }

    process.exitCode = exitCode;
  }

  private async closeServer(): Promise<void> {
    const server = this.server;
    if (!server?.listening) {
      return;
    }

    await new Promise<void>((resolve, reject) => {
      server.close((error) => {
        if (error) {
          reject(error);
          return;
        }
        resolve();
      });
    });
  }
}

export const app = App.getInstance();
