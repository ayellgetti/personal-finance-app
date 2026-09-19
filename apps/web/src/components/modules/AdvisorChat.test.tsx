/** @vitest-environment jsdom */
import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";

vi.mock("@/lib/auth/store", () => ({
  useAuth: () => ({ user: { isPaid: true } }),
}));

vi.mock("@/lib/finance/advisor-chat", () => ({
  listAdvisorChats: vi.fn().mockResolvedValue([
    {
      id: "chat-1",
      title: "How can I pay off my loans faster?",
      createdAt: "2026-09-19T00:00:00.000Z",
      updatedAt: "2026-09-19T00:00:00.000Z",
    },
  ]),
  getAdvisorChat: vi.fn(),
  removeAdvisorChat: vi.fn(),
  sendAdvisorChatMessage: vi.fn(),
  messagesFromConversation: vi.fn(),
}));

const { AdvisorChat } = await import("./AdvisorChat");

describe("AdvisorChat", () => {
  it("shows a chats section for saved conversations", async () => {
    render(<AdvisorChat />);
    expect(screen.getByRole("heading", { name: "Chats" })).toBeInTheDocument();
    expect(await screen.findByText("How can I pay off my loans faster?")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "New" })).toBeInTheDocument();
  });
});
