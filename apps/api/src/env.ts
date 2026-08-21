import { config } from "dotenv";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { z } from "zod";

config({ path: path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../.env") });

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  DATABASE_URL: z.string().min(1),
  PORT: z.coerce.number().int().positive().default(5001),
  CORS_ORIGIN: z.string().url().default("http://localhost:5173"),
  JWT_ACCESS_SECRET: z.string().min(16),
  JWT_REFRESH_SECRET: z.string().min(16),
  JWT_ACCESS_TTL: z.string().default("15m"),
  JWT_REFRESH_TTL_SECONDS: z.coerce.number().int().positive().default(604800),
  BCRYPT_ROUNDS: z.coerce.number().int().min(10).max(15).default(10),
  OPENAI_API_KEY: z.preprocess(
    (value) =>
      typeof value === "string" && value.trim() === "" ? undefined : value,
    z.string().trim().min(1).optional(),
  ),
  OPENAI_MODEL: z.string().trim().min(1).default("gpt-5-mini"),
  OPENAI_TIMEOUT_MS: z.coerce.number().int().min(1000).max(180000).default(90000),
  REDIS_URL: z.string().trim().min(1).default("redis://127.0.0.1:6379"),
  ADVISOR_ALLOW_REFRESH: z.preprocess((value) => {
    if (value === undefined || (typeof value === "string" && value.trim() === "")) {
      return undefined;
    }
    if (typeof value === "string") {
      const normalized = value.trim().toLowerCase();
      if (["1", "true", "yes"].includes(normalized)) return true;
      if (["0", "false", "no"].includes(normalized)) return false;
    }
    return value;
  }, z.boolean().optional()),
  UPLOAD_DIR: z.string().trim().min(1).default("uploads"),
  UPLOAD_MAX_FILE_SIZE_BYTES: z.coerce
    .number()
    .int()
    .positive()
    .max(50 * 1024 * 1024)
    .default(5 * 1024 * 1024),
});

const result = envSchema.safeParse(process.env);

if (!result.success) {
  throw new Error(`Invalid environment configuration: ${result.error.message}`);
}

export const env = result.data;
