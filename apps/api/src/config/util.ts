import { logger } from "../utils/logger.util";

type ShutdownHandler = (signal: string, exitCode: number) => Promise<void>;

export class Util {
  private processHandlersRegistered = false;

  registerProcessHandlers(shutdown: ShutdownHandler): void {
    if (this.processHandlersRegistered) {
      return;
    }

    this.processHandlersRegistered = true;

    process.once("SIGINT", () => void shutdown("SIGINT", 0));
    process.once("SIGTERM", () => void shutdown("SIGTERM", 0));
    process.once("unhandledRejection", (reason) => {
      this.logFatal("Unhandled promise rejection", reason);
      void shutdown("unhandledRejection", 1);
    });
    process.once("uncaughtException", (error) => {
      this.logFatal("Uncaught exception", error);
      void shutdown("uncaughtException", 1);
    });
    process.on("warning", (warning) => {
      logger.warn("Process warning", {
        warningType: warning.name,
        message: warning.message,
      });
    });
  }

  private logFatal(message: string, error: unknown): void {
    logger.error(message, {
      errorType: error instanceof Error ? error.name : "UnknownError",
      message: error instanceof Error ? error.message : String(error),
    });
  }
}

export const util = new Util();
