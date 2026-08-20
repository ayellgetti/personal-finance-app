import { logger } from "../../../utils/logger.util.js";
import { getRedis } from "../../../lib/redis.js";
import {
  advisorReportSchema,
  type AdvisorReport,
} from "./advisor.schema.js";

export type CachedAdvisorAdvice = {
  userId: string;
  contextHash: string;
  advice: AdvisorReport;
  updatedAt: Date;
};

export interface AdvisorReportStore {
  findByUserId(userId: string): Promise<CachedAdvisorAdvice | null>;
  upsert(input: {
    userId: string;
    contextHash: string;
    advice: AdvisorReport;
  }): Promise<CachedAdvisorAdvice>;
}

function cacheKey(userId: string) {
  return `advisor:advice:${userId}`;
}

type RedisPayload = {
  contextHash: string;
  advice: unknown;
  updatedAt: string;
};

export class RedisAdvisorStore implements AdvisorReportStore {
  async findByUserId(userId: string): Promise<CachedAdvisorAdvice | null> {
    try {
      const raw = await (await getRedis()).get(cacheKey(userId));
      if (!raw) return null;

      const payload = JSON.parse(raw) as RedisPayload;
      const parsed = advisorReportSchema.safeParse(payload.advice);
      if (!parsed.success || typeof payload.contextHash !== "string") {
        return null;
      }

      return {
        userId,
        contextHash: payload.contextHash,
        advice: parsed.data,
        updatedAt: new Date(payload.updatedAt),
      };
    } catch (error) {
      logger.error("Failed to read advisor cache from Redis", {
        errorType: error instanceof Error ? error.name : "UnknownError",
      });
      return null;
    }
  }

  async upsert(input: {
    userId: string;
    contextHash: string;
    advice: AdvisorReport;
  }): Promise<CachedAdvisorAdvice> {
    const saved: CachedAdvisorAdvice = {
      ...input,
      updatedAt: new Date(),
    };

    try {
      const payload: RedisPayload = {
        contextHash: saved.contextHash,
        advice: saved.advice,
        updatedAt: saved.updatedAt.toISOString(),
      };
      await (await getRedis()).set(cacheKey(input.userId), JSON.stringify(payload));
    } catch (error) {
      logger.error("Failed to write advisor cache to Redis", {
        errorType: error instanceof Error ? error.name : "UnknownError",
      });
    }

    return saved;
  }
}

export const redisAdvisorStore = new RedisAdvisorStore();
