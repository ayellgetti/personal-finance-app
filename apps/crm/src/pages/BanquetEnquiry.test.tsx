/** @vitest-environment jsdom */
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import BanquetEnquiry from "./BanquetEnquiry";

const submitPublicEnquiry = vi.fn();

vi.mock("sonner", () => ({ toast: { success: vi.fn(), error: vi.fn(), message: vi.fn() } }));

vi.mock("@/lib/crm/remote", () => ({
  submitPublicEnquiry: (...args: unknown[]) => submitPublicEnquiry(...args),
}));

describe("Banquet public enquiry form", () => {
  it("renders the standalone form without asking for a login", () => {
    render(<BanquetEnquiry />);
    expect(screen.getByRole("heading", { name: /Quick Event Enquiry/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Submit enquiry" })).toBeInTheDocument();
    expect(screen.queryByLabelText(/password/i)).not.toBeInTheDocument();
  });

  it("submits a public enquiry payload", async () => {
    submitPublicEnquiry.mockResolvedValue(undefined);
    render(<BanquetEnquiry />);

    fireEvent.change(screen.getByLabelText(/Customer name/), { target: { value: "Priya Sharma" } });
    fireEvent.change(screen.getByLabelText(/Phone number/), { target: { value: "9876543210" } });
    fireEvent.change(screen.getByLabelText(/Event type/), {
      target: { value: "Wedding Ceremony & Reception" },
    });
    fireEvent.change(screen.getByLabelText(/Event date/), { target: { value: "2026-12-12" } });
    fireEvent.change(screen.getByLabelText(/Time slot/), { target: { value: "evening" } });
    fireEvent.change(screen.getByLabelText(/Number of guests/), { target: { value: "100" } });
    fireEvent.change(screen.getByLabelText(/How did they find us/), { target: { value: "WhatsApp" } });
    fireEvent.change(screen.getByLabelText(/^Notes$/), { target: { value: "Need valet" } });
    fireEvent.click(screen.getByRole("button", { name: "Submit enquiry" }));

    await waitFor(() => {
      expect(submitPublicEnquiry).toHaveBeenCalledWith({
        kind: "banquet",
        name: "Priya Sharma",
        mobile: "9876543210",
        eventType: "Wedding Ceremony & Reception",
        eventDate: "2026-12-12",
        timeSlot: "evening",
        guestCount: 100,
        source: "WhatsApp",
        notes: "Need valet",
      });
    });
  });
});
