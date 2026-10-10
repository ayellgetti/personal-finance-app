/** @vitest-environment jsdom */
import { describe, expect, it, vi } from "vitest";
import { screen } from "@testing-library/react";
import { QuickAddSheet } from "@/components/layout/QuickAddSheet";
import { renderMobile } from "@/test/render-mobile";
import { CRM_PERMISSIONS } from "@/types/crm";

describe("quick add sheet", () => {
  it("offers only the actions the role can create", () => {
    renderMobile(
      <QuickAddSheet
        open
        onOpenChange={vi.fn()}
        permissions={[
          CRM_PERMISSIONS.contactsCreate,
          CRM_PERMISSIONS.paymentsCreate,
          CRM_PERMISSIONS.calendarCreate,
          CRM_PERMISSIONS.tasksCreate,
        ]}
      />,
    );

    expect(screen.getByRole("button", { name: /New contact/ })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Add payment/ })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Add reminder/ })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /New task/ })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /New enquiry/ })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /New follow-up/ })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /New event/ })).not.toBeInTheDocument();
  });

  it("explains when a role cannot create anything", () => {
    renderMobile(<QuickAddSheet open onOpenChange={vi.fn()} permissions={[CRM_PERMISSIONS.contactsRead]} />);

    expect(screen.getByText("Your role cannot create records.")).toBeInTheDocument();
  });

  it("renders nothing while closed", () => {
    renderMobile(
      <QuickAddSheet open={false} onOpenChange={vi.fn()} permissions={[CRM_PERMISSIONS.contactsCreate]} />,
    );

    expect(screen.queryByRole("button", { name: /New contact/ })).not.toBeInTheDocument();
  });
});
