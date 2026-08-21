import type { Express } from "express";
import { requestId } from "../middlewares/request-id.middleware";
import { requestLogger } from "../middlewares/request-logger.middleware";

export class Middleware {
  mount(app: Express): void {
    app.use(requestId);
    app.use(requestLogger);
  }
}

export const middleware = new Middleware();