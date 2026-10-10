/** @vitest-environment jsdom */
import { beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, screen, waitFor } from "@testing-library/react";
import Profile from "@/pages/Profile";
import { renderMobile } from "@/test/render-mobile";

const auth = vi.hoisted(() => ({ updateAccount: vi.fn(), logout: vi.fn() }));
const mobile = vi.hoisted(() => ({ reload: vi.fn() }));

vi.mock("@/lib/auth/store", () => ({
  useAuth: () => ({
    user: { firstName: "Ada", lastName: "Lovelace", name: "Ada Lovelace", email: "ada@example.com", mobileNo: "+91" },
    updateAccount: auth.updateAccount,
    logout: auth.logout,
  }),
}));
vi.mock("@/lib/mobile/store", () => ({
  useMobile: () => ({
    me: {
      user: { id: "u1", firstName: "Ada", lastName: "Lovelace", email: "ada@example.com", mobileNo: "+91" },
      roles: [{ id: "r1", name: "Admin", slug: "admin" }],
      permissions: [],
    },
    permissions: ["crm.dashboard.read"],
    reload: mobile.reload,
  }),
}));

beforeEach(() => {
  vi.clearAllMocks();
  auth.updateAccount.mockResolvedValue({ ok: true });
});

describe("profile", () => {
  it("saves a new name", async () => {
    renderMobile(<Profile />, ["/profile"]);
    fireEvent.change(screen.getByLabelText("First name"), { target: { value: "Augusta" } });
    fireEvent.click(screen.getByRole("button", { name: "Save name" }));
    await waitFor(() => expect(auth.updateAccount).toHaveBeenCalledWith({ firstName: "Augusta", lastName: "Lovelace" }));
    expect(mobile.reload).toHaveBeenCalled();
  });

  it("rejects a mismatched or reused password", async () => {
    renderMobile(<Profile />, ["/profile"]);
    fireEvent.change(screen.getByLabelText("Current password"), { target: { value: "oldpass12" } });
    fireEvent.change(screen.getByLabelText("New password"), { target: { value: "oldpass12" } });
    fireEvent.change(screen.getByLabelText("Confirm new password"), { target: { value: "different1" } });
    fireEvent.click(screen.getByRole("button", { name: "Change password" }));
    expect(await screen.findByText("New password must be different from the current password")).toBeInTheDocument();
    expect(screen.getByText("Passwords do not match")).toBeInTheDocument();
    expect(auth.updateAccount).not.toHaveBeenCalled();
  });

  it("changes the password", async () => {
    renderMobile(<Profile />, ["/profile"]);
    fireEvent.change(screen.getByLabelText("Current password"), { target: { value: "oldpass12" } });
    fireEvent.change(screen.getByLabelText("New password"), { target: { value: "newpass34" } });
    fireEvent.change(screen.getByLabelText("Confirm new password"), { target: { value: "newpass34" } });
    fireEvent.click(screen.getByRole("button", { name: "Change password" }));
    await waitFor(() =>
      expect(auth.updateAccount).toHaveBeenCalledWith({ currentPassword: "oldpass12", newPassword: "newpass34" }),
    );
  });
});
