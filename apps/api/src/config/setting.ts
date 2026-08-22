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
  /** Development escape hatch: never honoured once NODE_ENV is production. */
  private readonly ignoreAdvisorQuota =
    env.NODE_ENV !== "production" && env.ADVISOR_IGNORE_QUOTA === true;
  readonly advisor = {
    allowRefresh: env.ADVISOR_ALLOW_REFRESH === true || this.ignoreAdvisorQuota,
    ignoreQuota: this.ignoreAdvisorQuota,
  };
  readonly mail = {
    host: env.SMTP_HOST,
    port: env.SMTP_PORT,
    secure: env.SMTP_SECURE,
    user: env.SMTP_USER,
    pass: env.SMTP_PASS,
    from: env.SMTP_FROM ?? env.SMTP_USER,
  };
  readonly sms = {
    accountSid: env.TWILIO_ACCOUNT_SID,
    authToken: env.TWILIO_AUTH_TOKEN,
    from: env.TWILIO_FROM,
    defaultCountryCode: env.SMS_DEFAULT_COUNTRY_CODE,
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
