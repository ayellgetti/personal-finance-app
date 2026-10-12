import { logger } from "../../../utils/logger.util";
import { communicationService, type CommunicationService } from "./communication.service";

const DEFAULT_INTERVAL_MS = 15_000;

/** Polls due CRM messages inside the API process. There is no separate queue. */
export class MessageScheduler {
  private timer?: ReturnType<typeof setInterval>;

  constructor(private readonly service: CommunicationService = communicationService) {}

  start(intervalMs = DEFAULT_INTERVAL_MS): void {
    if (this.timer) return;
    void this.tick();
    const timer = setInterval(() => {
      void this.tick();
    }, intervalMs);
    timer.unref();
    this.timer = timer;
  }

  stop(): void {
    if (!this.timer) return;
    clearInterval(this.timer);
    this.timer = undefined;
  }

  private async tick(): Promise<void> {
    try {
      await this.service.dispatchDue();
    } catch (error) {
      logger.error("CRM message dispatch failed", {
        message: error instanceof Error ? error.message : String(error),
      });
    }
  }
}

export const messageScheduler = new MessageScheduler();
