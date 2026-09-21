/** @vitest-environment jsdom */
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import TravelEnquiry from "./TravelEnquiry";

const submitPublicEnquiry = vi.fn();

vi.mock("sonner", () => ({ toast: { success: vi.fn(), error: vi.fn(), message: vi.fn() } }));

vi.mock("@/lib/crm/remote", () => ({
  submitPublicEnquiry: (...args: unknown[]) => submitPublicEnquiry(...args),
}));

describe("Travel public enquiry form", () => {
  it("renders the standalone form without asking for a login", () => {
    render(<TravelEnquiry />);
    expect(screen.getByRole("heading", { name: /Quick Travel Enquiry/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Submit enquiry" })).toBeInTheDocument();
    expect(screen.queryByLabelText(/password/i)).not.toBeInTheDocument();
  });

  it("submits a public travel enquiry payload", async () => {
    submitPublicEnquiry.mockResolvedValue(undefined);
    render(<TravelEnquiry />);

    fireEvent.change(screen.getByLabelText(/Customer name/), { target: { value: "Amit Patel" } });
    fireEvent.change(screen.getByLabelText(/Phone number/), { target: { value: "9123456780" } });
    fireEvent.change(screen.getByLabelText(/Trip type/), { target: { value: "Honeymoon" } });
    fireEvent.change(screen.getByLabelText(/^Destination/), { target: { value: "Kerala" } });
    fireEvent.change(screen.getByLabelText(/Departure date/), { target: { value: "2026-11-01" } });
    fireEvent.change(screen.getByLabelText(/Return date/), { target: { value: "2026-11-08" } });
    fireEvent.change(screen.getByLabelText(/Number of travelers/), { target: { value: "2" } });
    fireEvent.change(screen.getByLabelText(/How did they find us/), { target: { value: "Instagram" } });
    fireEvent.change(screen.getByLabelText(/^Notes$/), { target: { value: "Prefer houseboat one night" } });
    fireEvent.click(screen.getByRole("button", { name: "Submit enquiry" }));

    await waitFor(() => {
      expect(submitPublicEnquiry).toHaveBeenCalledWith({
        kind: "travel",
        name: "Amit Patel",
        mobile: "9123456780",
        tripType: "Honeymoon",
        destination: "Kerala",
        departureDate: "2026-11-01",
        returnDate: "2026-11-08",
        travelerCount: 2,
        source: "Instagram",
        notes: "Prefer houseboat one night",
      });
    });
  });
});
