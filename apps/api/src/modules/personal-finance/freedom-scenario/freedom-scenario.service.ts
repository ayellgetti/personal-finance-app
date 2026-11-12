import type { Prisma } from "@prisma/client";
import { freedomScenarioModel, type FreedomScenarioModel } from "../../../models/index";
import { advisoryUserLock, type UserLock } from "../../../utils/user-lock.util";
import { HttpError } from "../../../utils/http-error.util";
import {
  MAX_FREEDOM_SCENARIOS,
  type CreateFreedomScenarioBody,
  type RemoveFreedomScenarioBody,
} from "./freedom-scenario.request";

const freedomScenarioLock = advisoryUserLock("freedom-scenario");

export class FreedomScenarioService {
  constructor(
    private readonly model: FreedomScenarioModel = freedomScenarioModel,
    private readonly withUserLock: UserLock = freedomScenarioLock,
  ) {}

  async list(userId: string) {
    const items = await this.model.read(
      { userId, isActive: 1 },
      { orderBy: { createdAt: "asc" }, take: MAX_FREEDOM_SCENARIOS },
    );
    return { items };
  }

  create(userId: string, body: CreateFreedomScenarioBody) {
    return this.withUserLock(userId, async () => {
      const saved = await this.model.count({ userId, isActive: 1 });
      if (saved >= MAX_FREEDOM_SCENARIOS) {
        throw new HttpError(
          409,
          `You can keep up to ${MAX_FREEDOM_SCENARIOS} saved what-ifs. Delete one to save another.`,
        );
      }
      return this.model.create({
        userId,
        title: body.title,
        mode: body.mode,
        input: body.input as Prisma.InputJsonValue,
        result: body.result as Prisma.InputJsonValue,
        createdBy: userId,
        updatedBy: userId,
      });
    });
  }

  async remove(userId: string, body: RemoveFreedomScenarioBody) {
    const existing = await this.model.readOne({ id: body.id, userId, isActive: 1 });
    if (!existing) {
      throw new HttpError(404, "Saved what-if not found");
    }
    await this.model.update({ id: body.id }, { isActive: 0, deletedAt: new Date(), deletedBy: userId });
    return { id: body.id, removed: true };
  }
}

export const freedomScenarioService = new FreedomScenarioService();
