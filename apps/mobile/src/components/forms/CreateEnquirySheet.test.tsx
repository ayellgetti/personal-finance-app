/** @vitest-environment jsdom */
import { describe, expect, it, vi } from "vitest";
import { fireEvent, screen } from "@testing-library/react";
import { CreateEnquirySheet } from "@/components/forms/CreateEnquirySheet";
import { renderMobile } from "@/test/render-mobile";

vi.mock("@/lib/mobile/remote", () => ({
  listContacts: vi.fn().mockResolvedValue({ items: [], pagination: { total: 0, page: 1, limit: 100, totalPages: 0, hasNextPage: false, hasPreviousPage: false } }),
  createContact: vi.fn(),
  createEnquiry: vi.fn(),
  updateEnquiry: vi.fn(),
}));

describe("add enquiry form", () => {
  it("matches the desk form: new contact, source, and stage", () => {
    renderMobile(
      <CreateEnquirySheet open onOpenChange={vi.fn()} onCreated={vi.fn()} />,
    );

    expect(screen.getByRole("heading", { name: "Add enquiry" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "+ New contact" })).toBeInTheDocument();
    expect(screen.getByLabelText("Full name")).toBeInTheDocument();
    expect(screen.getByLabelText("Mobile")).toBeInTheDocument();
    expect(screen.getByLabelText("Contact type")).toBeInTheDocument();
    expect(screen.getByLabelText("How did they find us?")).toBeInTheDocument();
    expect(screen.getByLabelText("Stage")).toBeInTheDocument();
    expect(screen.getByRole("group", { name: "Due date" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "7 days" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "1 month" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "3 months" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "6 months" })).toBeInTheDocument();
    expect(screen.getByText("Pick a date")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Create" })).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Existing contact" }));
    expect(screen.getByLabelText("Contact")).toBeInTheDocument();
    expect(screen.queryByLabelText("Full name")).not.toBeInTheDocument();
  });
});