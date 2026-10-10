/** @vitest-environment jsdom */
import { beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, screen, waitFor, within } from "@testing-library/react";
import Reminders from "@/pages/Reminders";
import { pageOf } from "@/test/fixtures";
import { renderMobile } from "@/test/render-mobile";
import { CRM_PERMISSIONS, type CrmCalendarEvent } from "@/types/crm";

const state = vi.hoisted(() => ({ permissions: [] as string[] }));
const remote = vi.hoisted(() => ({
  listCalendarEvents: vi.fn(),
  listCalendar: vi.fn(),
  listContacts: vi.fn(),
  createCalendarEvent: vi.fn(),
  updateCalendarEvent: vi.fn(),
  removeCalendarEvent: vi.fn(),
}));

vi.mock("@/lib/mobile/store", () => ({ useMobile: () => ({ permissions: state.permissions }) }));
vi.mock("@/lib/mobile/remote", () => remote);

function event(id: string, title: string, enquiryId: string | null): CrmCalendarEvent {
  return {
    id,
    title,
    startsAt: "2026-10-12T04:30:00.000Z",
    endsAt: "2026-10-12T05:00:00.000Z",
    slot: null,
    contactId: null,
    enquiryId,
    assigneeId: null,
    notes: null,
  } as CrmCalendarEvent;
}

beforeEach(() => {
  vi.clearAllMocks();
  state.permissions = [
    CRM_PERMISSIONS.calendarRead,
    CRM_PERMISSIONS.calendarCreate,
    CRM_PERMISSIONS.calendarUpdate,
    CRM_PERMISSIONS.calendarDelete,
  ];
  remote.listCalendarEvents.mockResolvedValue(
    pageOf([event("e1", "Pay electricity", null), event("e2", "Wedding booking", "enq-1")]),
  );
  remote.listCalendar.mockResolvedValue({ items: [] });
  remote.listContacts.mockResolvedValue(pageOf([]));
  remote.removeCalendarEvent.mockResolvedValue(undefined);
});

describe("reminders", () => {
  it("is forbidden without crm.calendar.read", () => {
    state.permissions = [];
    renderMobile(<Reminders />, ["/reminders"]);
    expect(screen.getByText("Your role cannot view reminders.")).toBeInTheDocument();
  });

  it("lists only events that are not tied to an enquiry", async () => {
    renderMobile(<Reminders />, ["/reminders"]);
    expect(await screen.findByText("Pay electricity")).toBeInTheDocument();
    expect(screen.queryByText("Wedding booking")).not.toBeInTheDocument();
  });

  it("confirms before removing a reminder", async () => {
    renderMobile(<Reminders />, ["/reminders"]);
    fireEvent.click(await screen.findByRole("button", { name: "Remove" }));
    const confirm = screen.getByRole("alertdialog");
    expect(confirm).toHaveTextContent("Pay electricity");
    fireEvent.click(within(confirm).getByRole("button", { name: "Remove" }));
    await waitFor(() => expect(remote.removeCalendarEvent).toHaveBeenCalledWith("e1"));
  });

  it("rejects a reminder without a title", async () => {
    renderMobile(<Reminders />, ["/reminders?new=1"]);
    fireEvent.click(await screen.findByRole("button", { name: "Create reminder" }));
    expect(await screen.findByText("Title is required (160 characters max)")).toBeInTheDocument();
    expect(remote.createCalendarEvent).not.toHaveBeenCalled();
  });
});
