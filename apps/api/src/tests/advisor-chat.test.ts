import assert from "node:assert/strict";
import test from "node:test";
import { HttpError } from "../utils/http-error.util";
import type { PlannerReport } from "../modules/personal-finance/planner/planner.engine";
import type { PlannerService } from "../modules/personal-finance/planner/planner.service";
import type { AiTextProvider } from "../modules/shared/ai/openai.provider";
import type { UserModel } from "../models/shared/user.model";
import type { AdvisorChatModel } from "../models/personal-finance/advisor-chat.model";
import type { AdvisorChatMessageModel } from "../models/personal-finance/advisor-chat-message.model";
import { AdvisorChatService } from "../modules/personal-finance/advisor-chat/advisor-chat.service";
import type { AdvisorChat, AdvisorChatMessage, User } from "@prisma/client";

const plannerReport = {
  cashflow: {
    income: 100000,
    livingExpenses: 40000,
    loanEmis: 20000,
    investments: 10000,
    totalOutflow: 70000,
    surplus: 30000,
    savingsRatePct: 30,
    sipsOnHold: false,
    pausedSip: 0,
    discretionary: 5000,
  },
  netWorth: {},
  goals: { fireGap: 0, fireProgressPct: 20 },
  liabilityPlan: { avalanche: [], scenarios: {}, investmentResumeMilestone: null },
} as unknown as PlannerReport;

function paidUser(overrides: Partial<User> = {}): User {
  return {
    id: "user-1",
    isPaid: true,
    ...overrides,
  } as User;
}

function chatRow(overrides: Partial<AdvisorChat> = {}): AdvisorChat {
  const now = new Date("2026-09-19T12:00:00.000Z");
  return {
    id: "chat-1",
    userId: "user-1",
    title: "What should I focus on?",
    isActive: 1,
    createdBy: "user-1",
    createdAt: now,
    updatedBy: "user-1",
    updatedAt: now,
    deletedBy: null,
    deletedAt: null,
    ...overrides,
  };
}

test("advisor chat creates a saved conversation on the first message", async () => {
  const created: AdvisorChatMessage[] = [];
  const service = new AdvisorChatService(
    { report: async () => plannerReport } as unknown as PlannerService,
    { generateText: async () => "Prepay the highest-rate loan first." } as AiTextProvider,
    { findById: async () => paidUser() } as unknown as UserModel,
    {
      create: async (data: { title: string }) => chatRow({ title: data.title }),
      update: async () => chatRow(),
      readOne: async () => null,
    } as unknown as AdvisorChatModel,
    {
      read: async () => [],
      create: async (data: AdvisorChatMessage) => {
        created.push(data);
        return data;
      },
    } as unknown as AdvisorChatMessageModel,
  );

  const result = await service.chat("user-1", { message: "What should I focus on?", history: [] });

  assert.equal(result.conversationId, "chat-1");
  assert.equal(result.title, "What should I focus on?");
  assert.equal(result.message, "Prepay the highest-rate loan first.");
  assert.equal(created.length, 2);
  assert.equal(created[0]?.role, "user");
  assert.equal(created[1]?.role, "assistant");
});

test("advisor chat continues a saved conversation using stored history", async () => {
  let prompt: { role: string; content: string }[] = [];
  const existing = chatRow();
  const prior: AdvisorChatMessage[] = [
    {
      ...existing,
      id: "m1",
      chatId: existing.id,
      role: "user",
      content: "Hi",
    },
    {
      ...existing,
      id: "m2",
      chatId: existing.id,
      role: "assistant",
      content: "Hello",
    },
  ];

  const service = new AdvisorChatService(
    { report: async () => plannerReport } as unknown as PlannerService,
    {
      generateText: async (request) => {
        prompt = request.messages;
        return "Keep paying scheduled EMIs.";
      },
    } as AiTextProvider,
    { findById: async () => paidUser() } as unknown as UserModel,
    {
      readOne: async () => existing,
      update: async () => existing,
    } as unknown as AdvisorChatModel,
    {
      read: async () => prior,
      create: async (data: AdvisorChatMessage) => data,
    } as unknown as AdvisorChatMessageModel,
  );

  const result = await service.chat("user-1", {
    message: "And then?",
    conversationId: "chat-1",
    history: [],
  });

  assert.equal(result.conversationId, "chat-1");
  assert.deepEqual(
    prompt.map((item) => item.content),
    ["Hi", "Hello", "And then?"],
  );
});

test("advisor chat rejects unpaid users", async () => {
  const service = new AdvisorChatService(
    { report: async () => plannerReport } as unknown as PlannerService,
    { generateText: async () => "no" } as AiTextProvider,
    { findById: async () => paidUser({ isPaid: false }) } as unknown as UserModel,
    {} as AdvisorChatModel,
    {} as AdvisorChatMessageModel,
  );

  await assert.rejects(
    () => service.chat("user-1", { message: "Hello", history: [] }),
    (error: unknown) => error instanceof HttpError && error.status === 402,
  );
});
