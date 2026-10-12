/** @vitest-environment jsdom */
import { beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { TooltipProvider } from "@/components/ui/tooltip";
import { CommunicationsModule } from "@/components/modules/CommunicationsModule";

const remote = vi.hoisted(() => ({
  listMessages: vi.fn(),
  listTemplates: vi.fn(),
  listContacts: vi.fn(),
  listRecipients: vi.fn(),
  createMessage: vi.fn(),
  createTemplate: vi.fn(),
  updateTemplate: vi.fn(),
  updateMessage: vi.fn(),
  cancelMessage: vi.fn(),
  removeMessage: vi.fn(),
  removeTemplate: vi.fn(),
}));

vi.mock("@/lib/crm/store", () => ({
  useCrm: () => ({
    status: "ready",
    hasPermission: () => true,
  }),
}));

vi.mock("@/lib/crm/remote", () => remote);

const emptyPage = {
  items: [],
  pagination: { total: 0, page: 1, limit: 25, totalPages: 0, hasNextPage: false, hasPreviousPage: false },
};

describe("CommunicationsModule", () => {
  beforeEach(() => {
    remote.listMessages.mockResolvedValue(emptyPage);
    remote.listTemplates.mockResolvedValue(emptyPage);
    remote.listContacts.mockResolvedValue({
      ...emptyPage,
      items: [
        {
          id: "contact-1",
          name: "Ada",
          mobile: "9876543210",
          type: "lead",
          email: "ada@example.com",
          companyName: "Analytical",
          notes: null,
        },
      ],
      pagination: { ...emptyPage.pagination, total: 1, totalPages: 1 },
    });
    remote.listRecipients.mockResolvedValue([]);
    remote.createMessage.mockResolvedValue({
      id: "message-1",
      channel: "sms",
      templateId: null,
      subject: null,
      body: "Table is ready",
      contactId: "contact-1",
      recipientUserId: null,
      toAddress: "9876543210",
      scheduledAt: "2026-10-13T04:00:00.000Z",
      status: "scheduled",
      sentAt: null,
      errorMessage: null,
      read: 0,
      readAt: null,
    });
  });

  it("schedules an on-the-fly SMS", async () => {
    render(
      <TooltipProvider>
        <CommunicationsModule />
      </TooltipProvider>,
    );

    expect(await screen.findByText("No messages yet")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "New message" }));

    expect(await screen.findByRole("option", { name: /Ada/ })).toBeInTheDocument();
    fireEvent.change(document.getElementById("channel") as HTMLSelectElement, { target: { value: "sms" } });
    fireEvent.change(document.getElementById("body") as HTMLTextAreaElement, { target: { value: "Table is ready" } });
    fireEvent.change(document.getElementById("contact") as HTMLSelectElement, { target: { value: "contact-1" } });
    fireEvent.change(document.getElementById("when") as HTMLInputElement, { target: { value: "2026-10-13T09:30" } });
    fireEvent.click(screen.getByRole("button", { name: "Schedule" }));

    await waitFor(() => {
      expect(remote.createMessage).toHaveBeenCalledWith(
        expect.objectContaining({
          channel: "sms",
          body: "Table is ready",
          contactId: "contact-1",
          scheduledAt: expect.any(String),
        }),
      );
    });
  });
});
