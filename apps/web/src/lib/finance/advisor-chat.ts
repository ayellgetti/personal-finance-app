import { api } from "@/lib/api";
import type { FinanceData } from "@/types/finance";
import {
  analyzeGoal,
  analyzeInsurance,
  creditUtilization,
  debtToIncome,
  emergencyFund,
  financialFreedom,
  formatCurrency,
  monthlyIncome,
  monthlySIP,
  monthlySavings,
  netWorth,
  savingsRate,
  totalInvestments,
} from "./calculations";

export type ChatRole = "user" | "assistant";

export type ChatMessage = {
  id: string;
  role: ChatRole;
  content: string;
  timestamp: Date;
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
    role: ChatRole;
    content: string;
    createdAt: string;
  }[];
};

type AdvisorChatRequest = {
  message: string;
  conversationId?: string;
  history: { role: ChatRole; content: string }[];
};

type AdvisorChatResponse = {
  conversationId: string;
  title: string;
  message: string;
};

function chatTimeout() {
  return typeof AbortSignal.timeout === "function" ? AbortSignal.timeout(110_000) : undefined;
}

export async function listAdvisorChats(): Promise<AdvisorChatSummary[]> {
  const response = await api<{ items: AdvisorChatSummary[] }>("/api/advisor/chats?limit=50");
  return response.items;
}

export async function getAdvisorChat(id: string): Promise<AdvisorChatDetail> {
  const response = await api<{ conversation: AdvisorChatDetail }>(`/api/advisor/chats/${id}`);
  return response.conversation;
}

export async function removeAdvisorChat(id: string): Promise<void> {
  await api("/api/advisor/chats/remove", { method: "POST", body: { id } });
}

const FALLBACK_STARTERS = [
  "What should I focus on to improve my financial health this month?",
  "Am I on track for financial freedom with my current SIPs?",
  "Where should I invest if I get a surplus this year?",
  "Can you review my goals and tell me which one is most at risk?",
  "How should I split extra money between debt, emergency fund, and SIPs?",
  "What is one change that would improve my health score the most?",
  "Is my asset mix too risky or too conservative for my age?",
  "How much of a raise should I put into investments vs lifestyle?",
  "What would a 12-month money plan look like for my household?",
  "Which expenses are easiest to cut without hurting essentials?",
  "Should I build an emergency fund before I invest more?",
  "How do I set a monthly budget I can actually stick to?",
];

/** Starter questions shaped by this household, plus general planning prompts. */
export function advisorChatStarters(d: FinanceData): string[] {
  const cur = d.profile.currency;
  const surplus = monthlySavings(d);
  const income = monthlyIncome(d);
  const sr = savingsRate(d);
  const dti = debtToIncome(d);
  const ef = emergencyFund(d);
  const ins = analyzeInsurance(d);
  const fi = financialFreedom(d);
  const util = creditUtilization(d);
  const sip = monthlySIP(d);
  const nw = netWorth(d);
  const corpus = totalInvestments(d);
  const costliest = [...d.loans].sort((a, b) => b.interestRate - a.interestRate)[0];
  const riskiestGoal = d.goals
    .map((goal) => analyzeGoal(d, goal))
    .sort((a, b) => a.probability - b.probability)[0];
  const personal: string[] = [];

  if (surplus < 0) {
    personal.push(
      `My monthly surplus is ${formatCurrency(surplus, cur)}. What should I cut or refinance first?`,
    );
  } else if (income > 0) {
    personal.push(
      `I save ${formatCurrency(surplus, cur)} a month (${sr.toFixed(0)}% of income). How can I raise that to 30%?`,
    );
  }
  if (dti >= 35) {
    personal.push(`EMIs take ${dti.toFixed(0)}% of my income. How do I bring that under 35%?`);
  } else if (dti > 0) {
    personal.push(`My EMI-to-income ratio is ${dti.toFixed(0)}%. Is that healthy, or should I prepay?`);
  }
  if (ef.coverageMonths < ef.targetMonths) {
    personal.push(
      `I only have ${ef.coverageMonths.toFixed(1)} months of emergency cover. How do I get to ${ef.targetMonths}?`,
    );
  } else if (ef.coverageMonths > 0) {
    personal.push(
      `I have ${ef.coverageMonths.toFixed(1)} months of emergency cover. Can I invest the extra cash instead?`,
    );
  }
  if (util > 30) {
    personal.push(`My credit-card utilization is ${util.toFixed(0)}%. What's the fastest way to bring it down?`);
  } else if (d.creditCards.length) {
    personal.push("How should I use my credit cards without hurting my cashflow or score?");
  }
  if (fi.yearsRemaining >= 40) {
    personal.push(`My freedom date is ${fi.fiDate.getFullYear()}. What would move it closer?`);
  } else {
    personal.push(`I'm ${fi.yearsRemaining} years from the freedom date. What would pull that in by 5 years?`);
  }
  if (surplus < 0 && sip > 0) {
    personal.push(
      `I'm still putting ${formatCurrency(sip, cur)} into SIPs with a negative surplus. Should I pause them?`,
    );
  } else if (sip > 0) {
    personal.push(
      `I invest ${formatCurrency(sip, cur)} in SIPs on a ${formatCurrency(corpus, cur, true)} corpus. Should I increase that?`,
    );
  }
  if (ins.termGap > 0) {
    personal.push(`There's a ${formatCurrency(ins.termGap, cur, true)} gap in my term cover. Is that urgent?`);
  }
  if (ins.healthGap > 0) {
    personal.push(
      `My health cover is short by ${formatCurrency(ins.healthGap, cur, true)}. What cover should I buy?`,
    );
  }
  if (costliest) {
    personal.push(
      `Should I prepay ${costliest.name} at ${costliest.interestRate}% before my other loans?`,
    );
  }
  if (nw < 0) {
    personal.push(
      `My net worth is ${formatCurrency(nw, cur, true)}. What's the cleanest path back to positive?`,
    );
  }
  if (riskiestGoal && riskiestGoal.status !== "On Track") {
    personal.push(
      `${riskiestGoal.goal.name} looks ${riskiestGoal.status.toLowerCase()}. How do I get it on track?`,
    );
  }
  if (d.incomes.length > 1) {
    personal.push("I have more than one income source. How should I treat the unstable ones?");
  }

  const seen = new Set<string>();
  const out: string[] = [];
  for (const prompt of [...personal, ...FALLBACK_STARTERS]) {
    if (seen.has(prompt)) continue;
    seen.add(prompt);
    out.push(prompt);
  }
  return out;
}

export function messagesFromConversation(conversation: AdvisorChatDetail): ChatMessage[] {
  return conversation.messages.map((item) => ({
    id: item.id,
    role: item.role,
    content: item.content,
    timestamp: new Date(item.createdAt),
  }));
}

/**
 * Send one message. The first successful reply creates a saved chat;
 * later calls should pass that conversationId.
 */
export async function sendAdvisorChatMessage(
  message: string,
  history: ChatMessage[],
  conversationId?: string,
): Promise<AdvisorChatResponse> {
  const trimmed = conversationId
    ? []
    : history.slice(-20).map(({ role, content }) => ({ role, content }));

  return api<AdvisorChatResponse>("/api/advisor/chat", {
    method: "POST",
    body: {
      message,
      history: trimmed,
      ...(conversationId ? { conversationId } : {}),
    } satisfies AdvisorChatRequest,
    signal: chatTimeout(),
  });
}
