import { api } from "@/lib/api";

export type ChatRole = "user" | "assistant";

export type ChatMessage = {
  id: string;
  role: ChatRole;
  content: string;
  timestamp: Date;
};

type AdvisorChatRequest = {
  message: string;
  history: { role: ChatRole; content: string }[];
};

type AdvisorChatResponse = {
  message: string;
};

/**
 * Send one message to the advisor chat endpoint.
 * The caller supplies recent history for multi-turn context;
 * the server is stateless per request.
 */
export async function sendAdvisorChatMessage(
  message: string,
  history: ChatMessage[],
): Promise<string> {
  // Send at most the last 20 turns to stay within the server limit.
  const trimmed = history.slice(-20).map(({ role, content }) => ({ role, content }));

  const response = await api.post<AdvisorChatResponse>("/api/advisor/chat", {
    message,
    history: trimmed,
  } satisfies AdvisorChatRequest);

  return response.message;
}
