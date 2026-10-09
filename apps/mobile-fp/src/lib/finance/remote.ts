import { api, apiForm } from "@/lib/api";
import type {
  Budget,
  FinanceSnapshot,
  FinancialProfile,
  Goal,
  Insurance,
  Investment,
  Loan,
  PlannerReport,
} from "@/types/finance";

type ListResult<T> = {
  items: T[];
  page?: number;
  limit?: number;
  total?: number;
};

export type FinanceEntity = "budgets" | "loans" | "investments" | "insurances" | "goals";

type EntityMap = {
  budgets: Budget;
  loans: Loan;
  investments: Investment;
  insurances: Insurance;
  goals: Goal;
};

const RESPONSE_KEYS: Record<FinanceEntity, string> = {
  budgets: "budget",
  loans: "loan",
  investments: "investment",
  insurances: "insurance",
  goals: "goal",
};

export async function listEntity<K extends FinanceEntity>(
  entity: K,
  query = "",
): Promise<ListResult<EntityMap[K]>> {
  return api<ListResult<EntityMap[K]>>(`/api/${entity}?limit=100${query}`);
}

export async function createEntity<K extends FinanceEntity>(
  entity: K,
  body: Omit<EntityMap[K], "id">,
): Promise<EntityMap[K]> {
  const result = await api<Record<string, EntityMap[K]>>(`/api/${entity}`, {
    method: "POST",
    body,
  });
  return result[RESPONSE_KEYS[entity]];
}

export async function updateEntity<K extends FinanceEntity>(
  entity: K,
  id: string,
  body: Partial<Omit<EntityMap[K], "id">>,
): Promise<EntityMap[K]> {
  const result = await api<Record<string, EntityMap[K]>>(`/api/${entity}/${id}`, {
    method: "PATCH",
    body,
  });
  return result[RESPONSE_KEYS[entity]];
}

export async function removeEntity(entity: FinanceEntity, id: string): Promise<void> {
  await api(`/api/${entity}/remove`, { method: "POST", body: { id } });
}

export async function fetchFinancialProfile(): Promise<FinancialProfile | null> {
  const result = await api<{ financialProfile: FinancialProfile | null }>("/api/financial-profile");
  return result.financialProfile;
}

export async function saveFinancialProfile(profile: FinancialProfile): Promise<FinancialProfile> {
  const result = await api<{ financialProfile: FinancialProfile }>("/api/financial-profile", {
    method: "PUT",
    body: profile,
  });
  return result.financialProfile;
}

export async function fetchPlannerReport(): Promise<PlannerReport> {
  const result = await api<{ report: PlannerReport }>("/api/planner/report");
  return result.report;
}

export async function fetchFinanceSnapshot(): Promise<FinanceSnapshot> {
  const [budgets, loans, investments, insurances, goals, profile, planner] = await Promise.all([
    listEntity("budgets"),
    listEntity("loans"),
    listEntity("investments"),
    listEntity("insurances"),
    listEntity("goals"),
    fetchFinancialProfile().catch(() => null),
    fetchPlannerReport().catch(() => null),
  ]);
  return {
    budgets: budgets.items,
    loans: loans.items,
    investments: investments.items,
    insurances: insurances.items,
    goals: goals.items,
    profile,
    planner,
  };
}

export type AdvisorReport = {
  executiveSummary: string;
  summaryReport: {
    headline: string;
    highlights: Array<{ label: string; detail: string }>;
  };
  riskWarnings: Array<{ severity: "high" | "medium" | "low"; title: string; detail: string }>;
  planOfAction: Array<{
    priority: number;
    category: string;
    impact: "High" | "Medium" | "Low";
    action: string;
    rationale: string;
    monthlyAmount: number | null;
  }>;
  assumptions: string[];
  disclaimer: string;
};

export function fetchAdvisorReport(refresh = false) {
  return api<{
    advice: AdvisorReport;
    source: "openai" | "cache" | "rules";
    generatedAt?: string;
    stale?: boolean;
  }>(`/api/advisor/report${refresh ? "?refresh=1" : ""}`, {
    method: "POST",
  });
}

export type AdvisorChatSummary = { id: string; title?: string; updatedAt?: string };
export type AdvisorChatMessage = { id?: string; role: "user" | "assistant"; content: string };

export function listAdvisorChats() {
  return api<{ items: AdvisorChatSummary[] }>("/api/advisor/chats?limit=50");
}

export function getAdvisorChat(id: string) {
  return api<{ conversation: AdvisorChatSummary & { messages: AdvisorChatMessage[] } }>(`/api/advisor/chats/${id}`);
}

export function sendAdvisorMessage(message: string, conversationId?: string) {
  return api<{ conversationId: string; title: string; message: string }>("/api/advisor/chat", {
    method: "POST",
    body: {
      message,
      history: [],
      ...(conversationId ? { conversationId } : {}),
    },
    signal: typeof AbortSignal.timeout === "function" ? AbortSignal.timeout(110_000) : undefined,
  });
}

export function listStatements() {
  return api<{ items: Array<{ id: string; title?: string; fileName?: string; createdAt: string }> }>(
    "/api/statements?limit=100",
  );
}

export function uploadStatement(file: File, sourceType: "bank" | "phone", password?: string) {
  const form = new FormData();
  form.set("file", file);
  form.set("fileName", file.name);
  form.set("sourceType", sourceType);
  if (password) form.set("password", password);
  return apiForm<{ statement: { id: string } }>("/api/statements/upload", form);
}

export function previewCalculator(type: string, input: Record<string, number | string>) {
  return api<{ result: Record<string, unknown> }>("/api/calculators/preview", {
    method: "POST",
    body: { type, ...input },
  }).then((response) => response.result);
}
