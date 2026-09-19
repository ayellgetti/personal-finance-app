import { beforeEach, describe, expect, it, vi } from "vitest";

const api = vi.fn();

vi.mock("@/lib/api", () => ({
  api,
  ApiError: class ApiError extends Error {
    constructor(
      public readonly status: number,
      message: string,
    ) {
      super(message);
      this.name = "ApiError";
    }
  },
}));

const { listAdvisorChats, sendAdvisorChatMessage } = await import("./advisor-chat");

describe("advisor chat remote", () => {
  beforeEach(() => {
    api.mockReset();
  });

  it("lists saved conversations", async () => {
    api.mockResolvedValue({
      items: [{ id: "chat-1", title: "Loans", createdAt: "2026-09-19T00:00:00.000Z", updatedAt: "2026-09-19T00:00:00.000Z" }],
    });
    await expect(listAdvisorChats()).resolves.toEqual([
      expect.objectContaining({ id: "chat-1", title: "Loans" }),
    ]);
    expect(api).toHaveBeenCalledWith("/api/advisor/chats?limit=50");
  });

  it("posts a new message without a conversation id", async () => {
    api.mockResolvedValue({
      conversationId: "chat-1",
      title: "What next?",
      message: "Pay the highest-rate loan first.",
    });

    const reply = await sendAdvisorChatMessage("What next?", [
      { id: "1", role: "user", content: "Hi", timestamp: new Date() },
      { id: "2", role: "assistant", content: "Hello", timestamp: new Date() },
    ]);

    expect(reply.conversationId).toBe("chat-1");
    expect(reply.message).toBe("Pay the highest-rate loan first.");
    expect(api).toHaveBeenCalledWith(
      "/api/advisor/chat",
      expect.objectContaining({
        method: "POST",
        body: {
          message: "What next?",
          history: [
            { role: "user", content: "Hi" },
            { role: "assistant", content: "Hello" },
          ],
        },
      }),
    );
  });

  it("sends conversationId and skips client history for a saved chat", async () => {
    api.mockResolvedValue({
      conversationId: "chat-1",
      title: "What next?",
      message: "Keep going.",
    });

    await sendAdvisorChatMessage("Next?", [], "chat-1");

    expect(api).toHaveBeenCalledWith(
      "/api/advisor/chat",
      expect.objectContaining({
        body: {
          message: "Next?",
          history: [],
          conversationId: "chat-1",
        },
      }),
    );
  });
});
