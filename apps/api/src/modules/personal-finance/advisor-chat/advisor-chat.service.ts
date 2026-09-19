import type { AdvisorChat, AdvisorChatMessage, AdvisorChatRole } from "@prisma/client";
import { HttpError } from "../../../utils/http-error.util";
import {
  openAiProvider,
  type AiTextProvider,
} from "../../shared/ai/openai.provider";
import { userModel, type UserModel } from "../../../models/shared/user.model";
import {
  advisorChatModel,
  advisorChatMessageModel,
  type AdvisorChatModel,
  type AdvisorChatMessageModel,
} from "../../../models/index";
import {
  plannerService,
  type PlannerService,
} from "../planner/planner.service";
import { buildAdvisorContext } from "../advisor/advisor.prompt";
import { buildAdvisorChatSystemPrompt } from "./advisor-chat.prompt";
import type {
  AdvisorChatBody,
  ListAdvisorChatsQuery,
  RemoveAdvisorChatBody,
} from "./advisor-chat.request";

const HISTORY_LIMIT = 20;
const MESSAGE_LIMIT = 200;

export type AdvisorChatResult = {
  conversationId: string;
  title: string;
  message: string;
};

export type AdvisorChatSummary = {
  id: string;
  title: string;
  createdAt: string;
  updatedAt: string;
};

export type AdvisorChatDetail = AdvisorChatSummary & {
  messages: {
    id: string;
    role: AdvisorChatRole;
    content: string;
    createdAt: string;
  }[];
};

function titleFromMessage(text: string): string {
  const oneLine = text.replace(/\s+/g, " ").trim();
  if (oneLine.length <= 60) return oneLine;
  return `${oneLine.slice(0, 57)}...`;
}

function toSummary(chat: AdvisorChat): AdvisorChatSummary {
  return {
    id: chat.id,
    title: chat.title,
    createdAt: chat.createdAt.toISOString(),
    updatedAt: chat.updatedAt.toISOString(),
  };
}

function toMessage(row: AdvisorChatMessage) {
  return {
    id: row.id,
    role: row.role,
    content: row.content,
    createdAt: row.createdAt.toISOString(),
  };
}

export class AdvisorChatService {
  constructor(
    private readonly planner: PlannerService = plannerService,
    private readonly provider: AiTextProvider = openAiProvider,
    private readonly users: UserModel = userModel,
    private readonly chats: AdvisorChatModel = advisorChatModel,
    private readonly messages: AdvisorChatMessageModel = advisorChatMessageModel,
  ) {}

  async list(userId: string, query: ListAdvisorChatsQuery) {
    await this.requirePaid(userId);
    const result = await this.chats.paginate(
      { userId, isActive: 1 },
      query.page ?? 1,
      query.limit ?? 25,
      { orderBy: { updatedAt: "desc" } },
    );
    return {
      items: result.items.map(toSummary),
      pagination: result.pagination,
    };
  }

  async getById(userId: string, id: string): Promise<AdvisorChatDetail> {
    await this.requirePaid(userId);
    const chat = await this.requireOwned(userId, id);
    const rows = await this.messages.read(
      { chatId: id, isActive: 1 },
      { orderBy: { createdAt: "asc" }, take: MESSAGE_LIMIT },
    );
    return {
      ...toSummary(chat),
      messages: rows.map(toMessage),
    };
  }

  async chat(
    userId: string,
    body: AdvisorChatBody,
    requestId?: string,
  ): Promise<AdvisorChatResult> {
    await this.requirePaid(userId);

    const existing = body.conversationId
      ? await this.requireOwned(userId, body.conversationId)
      : null;

    const stored = existing
      ? await this.messages.read(
          { chatId: existing.id, isActive: 1 },
          { orderBy: { createdAt: "asc" }, take: HISTORY_LIMIT },
        )
      : [];

    const history = existing
      ? stored.map((row) => ({ role: row.role, content: row.content }))
      : body.history;

    const plannerReport = await this.planner.report(userId);
    const context = buildAdvisorContext(plannerReport);
    const systemPrompt = buildAdvisorChatSystemPrompt(context);

    const reply = await this.provider.generateText({
      system: systemPrompt,
      messages: [...history, { role: "user", content: body.message }],
      requestId,
    });

    const chat =
      existing ??
      (await this.chats.create({
        userId,
        title: titleFromMessage(body.message),
        createdBy: userId,
        updatedBy: userId,
      }));

    await this.messages.create({
      chatId: chat.id,
      userId,
      role: "user",
      content: body.message,
      createdBy: userId,
      updatedBy: userId,
    });
    await this.messages.create({
      chatId: chat.id,
      userId,
      role: "assistant",
      content: reply,
      createdBy: userId,
      updatedBy: userId,
    });
    await this.chats.update(
      { id: chat.id },
      { updatedBy: userId, updatedAt: new Date() },
    );

    return {
      conversationId: chat.id,
      title: chat.title,
      message: reply,
    };
  }

  async remove(userId: string, input: RemoveAdvisorChatBody) {
    await this.requirePaid(userId);
    await this.requireOwned(userId, input.id);
    const now = new Date();
    await this.messages.updateMany(
      { chatId: input.id, userId, isActive: 1 },
      { isActive: 0, deletedAt: now, deletedBy: userId, updatedBy: userId },
    );
    await this.chats.update(
      { id: input.id },
      { isActive: 0, deletedAt: now, deletedBy: userId, updatedBy: userId },
    );
    return { id: input.id, removed: true };
  }

  private async requirePaid(userId: string) {
    const user = await this.users.findById(userId);
    if (!user) {
      throw new HttpError(401, "Unauthenticated");
    }
    if (!user.isPaid) {
      throw new HttpError(402, "AI Chat is available for paid subscribers only", {
        code: "CHAT_REQUIRES_PAID_PLAN",
      });
    }
    return user;
  }

  private async requireOwned(userId: string, id: string) {
    const chat = await this.chats.readOne({ id });
    if (!chat || chat.userId !== userId || chat.isActive !== 1) {
      throw new HttpError(404, "Chat not found");
    }
    return chat;
  }
}

export const advisorChatService = new AdvisorChatService();
