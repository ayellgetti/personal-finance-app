import OpenAI from "openai";
import { setting } from "../../../config/setting.js";
import { HttpError } from "../../../lib/http-error.js";
import { logger } from "../../../utils/logger.util.js";

export type AiJsonRequest = {
  system: string;
  user: string;
  requestId?: string;
};

export interface AiJsonProvider {
  generateJson(request: AiJsonRequest): Promise<unknown>;
}

export class OpenAiProvider implements AiJsonProvider {
  private readonly client?: OpenAI;

  constructor() {
    if (setting.openai.apiKey) {
      this.client = new OpenAI({
        apiKey: setting.openai.apiKey,
        timeout: setting.openai.timeoutMs,
        maxRetries: 0,
      });
    }
  }

  async generateJson(request: AiJsonRequest): Promise<unknown> {
    if (!this.client) {
      throw new HttpError(
        503,
        "AI financial advisor is not configured",
        { provider: "openai" },
      );
    }

    try {
      const model = setting.openai.model;
      const completion = await this.client.chat.completions.create(
        {
          model,
          response_format: { type: "json_object" },
          max_completion_tokens: 3500,
          ...(model.startsWith("gpt-5")
            ? { reasoning_effort: "low" as const }
            : {}),
          messages: [
            { role: "system", content: request.system },
            { role: "user", content: request.user },
          ],
        },
        {
          timeout: setting.openai.timeoutMs,
          maxRetries: 0,
          ...(request.requestId
            ? { headers: { "x-request-id": request.requestId } }
            : {}),
        },
      );

      const content = completion.choices[0]?.message.content;
      if (!content) {
        throw new HttpError(502, "OpenAI returned an empty response");
      }

      try {
        return JSON.parse(content) as unknown;
      } catch {
        throw new HttpError(502, "OpenAI returned invalid JSON");
      }
    } catch (error) {
      if (error instanceof HttpError) {
        throw error;
      }

      const status =
        error instanceof OpenAI.APIError && error.status === 429
          ? 503
          : error instanceof OpenAI.APIConnectionTimeoutError
            ? 504
            : 502;

      logger.error("OpenAI request failed", {
        requestId: request.requestId,
        status:
          error instanceof OpenAI.APIError ? error.status : undefined,
        code: error instanceof OpenAI.APIError ? error.code : undefined,
        errorType: error instanceof Error ? error.name : "UnknownError",
        message:
          error instanceof Error ? error.message.slice(0, 240) : undefined,
      });

      throw new HttpError(status, "Unable to generate AI financial advice", {
        provider: "openai",
      });
    }
  }
}

export const openAiProvider = new OpenAiProvider();
