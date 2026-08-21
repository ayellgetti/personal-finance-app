import { env } from "../env";

export class Setting {
  readonly environment = env.NODE_ENV;
  readonly port = env.PORT;
  readonly corsOrigin = env.CORS_ORIGIN;
  readonly bcryptRounds = env.BCRYPT_ROUNDS;
  readonly jwt = {
    accessSecret: env.JWT_ACCESS_SECRET,
    refreshSecret: env.JWT_REFRESH_SECRET,
    accessTtl: env.JWT_ACCESS_TTL,
    refreshTtlSeconds: env.JWT_REFRESH_TTL_SECONDS,
  };
  readonly openai = {
    apiKey: env.OPENAI_API_KEY,
    model: env.OPENAI_MODEL,
    timeoutMs: env.OPENAI_TIMEOUT_MS,
  };
  readonly redis = {
    url: env.REDIS_URL,
  };
  readonly advisor = {
    allowRefresh: env.ADVISOR_ALLOW_REFRESH === true,
  };
  readonly upload = {
    directory: env.UPLOAD_DIR,
    maxFileSizeBytes: env.UPLOAD_MAX_FILE_SIZE_BYTES,
  };

  get isProduction(): boolean {
    return this.environment === "production";
  }
}

export const setting = new Setting();
