import { api } from "@/lib/api";

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
