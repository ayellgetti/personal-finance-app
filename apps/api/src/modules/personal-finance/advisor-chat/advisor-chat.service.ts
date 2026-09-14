import { HttpError } from "../../../utils/http-error.util";
import {
  openAiProvider,
  type AiTextProvider,
} from "../../shared/ai/openai.provider";
import { userModel } from "../../../models/shared/user.model";
import {
  plannerService,
  type PlannerService,
} from "../planner/planner.service";
import { buildAdvisorContext } from "../advisor/advisor.prompt";
import { buildAdvisorChatSystemPrompt } from "./advisor-chat.prompt";
import type { AdvisorChatBody } from "./advisor-chat.request";

export type AdvisorChatResult = {
  message: string;
};

export class AdvisorChatService {
  constructor(
    private readonly planner: PlannerService = plannerService,
    private readonly provider: AiTextProvider = openAiProvider,
  ) {}

  async chat(
    userId: string,
    body: AdvisorChatBody,
    requestId?: string,
  ): Promise<AdvisorChatResult> {
    const user = await userModel.findById(userId);
    if (!user) {
      throw new HttpError(401, "Unauthenticated");
    }
    if (!user.isPaid) {
      throw new HttpError(402, "AI Chat is available for paid subscribers only", {
        code: "CHAT_REQUIRES_PAID_PLAN",
      });
    }

    const plannerReport = await this.planner.report(userId);
    const context = buildAdvisorContext(plannerReport);
    const systemPrompt = buildAdvisorChatSystemPrompt(context);

    const message = await this.provider.generateText({
      system: systemPrompt,
      messages: [
        ...body.history,
        { role: "user", content: body.message },
      ],
      requestId,
    });

    return { message };
  }
}

export const advisorChatService = new AdvisorChatService();
