import { setting } from "../../../config/setting";
import { HttpError } from "../../../utils/http-error.util";
import {
  openAiProvider,
  type AiJsonProvider,
} from "../../shared/ai/openai.provider";
import {
  plannerService,
  type PlannerService,
} from "../planner/planner.service";
import {
  redisAdvisorStore,
  type AdvisorReportStore,
} from "./advisor.cache";
import {
  ADVISOR_SYSTEM_PROMPT,
  buildAdvisorUserPrompt,
  hashAdvisorContext,
} from "./advisor.prompt";
import {
  advisorReportSchema,
  type AdvisorReport,
} from "./advisor.schema";

export type AdvisorReportResult = {
  planner: Awaited<ReturnType<PlannerService["report"]>>;
  advice: AdvisorReport;
  source: "openai" | "cache";
  generatedAt: string;
};

export class AdvisorService {
  constructor(
    private readonly planner: PlannerService = plannerService,
    private readonly provider: AiJsonProvider = openAiProvider,
    private readonly store: AdvisorReportStore = redisAdvisorStore,
    private readonly allowRefresh: boolean = setting.advisor.allowRefresh,
  ) {}

  async report(
    userId: string,
    requestId?: string,
    options: { refresh?: boolean } = {},
  ): Promise<AdvisorReportResult> {
    const planner = await this.planner.report(userId);
    const contextHash = hashAdvisorContext(planner);
    const cached = await this.store.findByUserId(userId);
    const refresh = Boolean(options.refresh) && this.allowRefresh;

    if (!refresh && cached?.contextHash === contextHash) {
      return {
        planner,
        advice: cached.advice,
        source: "cache",
        generatedAt: cached.updatedAt.toISOString(),
      };
    }

    try {
      const rawAdvice = await this.provider.generateJson({
        system: ADVISOR_SYSTEM_PROMPT,
        user: buildAdvisorUserPrompt(planner),
        requestId,
      });
      const parsed = advisorReportSchema.safeParse(rawAdvice);

      if (!parsed.success) {
        throw new HttpError(502, "OpenAI returned an invalid advisor report", {
          provider: "openai",
          validation: parsed.error.issues.map((issue) => ({
            path: issue.path.join("."),
            code: issue.code,
            message: issue.message,
          })),
        });
      }

      const saved = await this.store.upsert({
        userId,
        contextHash,
        advice: parsed.data,
      });

      return {
        planner,
        advice: saved.advice,
        source: "openai",
        generatedAt: saved.updatedAt.toISOString(),
      };
    } catch (error) {
      if (cached) {
        return {
          planner,
          advice: cached.advice,
          source: "cache",
          generatedAt: cached.updatedAt.toISOString(),
        };
      }
      throw error;
    }
  }
}

export const advisorService = new AdvisorService();
