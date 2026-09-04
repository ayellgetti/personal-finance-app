/** @vitest-environment jsdom */
import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { CrmSessionGate } from "@/components/CrmSessionGate";

vi.mock("@/lib/auth/store", () => ({
  useAuth: () => ({ logout: vi.fn() }),
}));

vi.mock("@/lib/crm/store", () => ({
  useCrm: () => ({
    status: "forbidden",
    errorMessage: null,
    reload: vi.fn(),
  }),
}));

describe("CrmSessionGate", () => {
  it("shows no-access when /api/crm/me is forbidden", () => {
    render(
      <CrmSessionGate>
        <div>CRM home</div>
      </CrmSessionGate>,
    );

    expect(screen.getByText("No access")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Sign out" })).toBeInTheDocument();
    expect(screen.queryByText("CRM home")).not.toBeInTheDocument();
  });
});
