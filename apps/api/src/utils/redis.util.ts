import { createClient, type RedisClientType } from "redis";
import { setting } from "../config/setting";
import { logger } from "./logger.util";

let client: RedisClientType | undefined;
let connectPromise: Promise<RedisClientType> | undefined;

export async function getRedis(): Promise<RedisClientType> {
  if (client?.isOpen) return client;

  if (!connectPromise) {
    const next = createClient({ url: setting.redis.url });
    next.on("error", (error) => {
      logger.error("Redis client error", {
        errorType: error instanceof Error ? error.name : "UnknownError",
        message: error instanceof Error ? error.message.slice(0, 200) : undefined,
      });
    });
    connectPromise = next.connect().then(() => {
      client = next;
      return next;
    });
  }

  try {
    return await connectPromise;
  } catch (error) {
    connectPromise = undefined;
    throw error;
  }
}

export async function closeRedis(): Promise<void> {
  if (!client?.isOpen) {
    return;
  }

  await client.quit();
  client = undefined;
  connectPromise = undefined;
}
