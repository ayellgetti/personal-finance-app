/** @vitest-environment jsdom */
import { afterEach, describe, expect, it, vi } from "vitest";
import { render, screen, waitFor, within } from "@testing-library/react";
import App from "@/App";

vi.mock("virtual:pwa-register", () => ({ registerSW: () => () => undefined }));

/** api.ts refreshes ahead of expiry, so a stored session needs a decodable exp to stay put. */
function freshAccessToken() {
  const payload = btoa(JSON.stringify({ exp: Math.floor(Date.now() / 1000) + 3600 }));
  return `header.${payload}.signature`;
}

afterEach(() => {
  localStorage.clear();
  vi.unstubAllGlobals();
  window.history.pushState({}, "", "/");
});

describe("app boot", () => {
  it("sends a signed-out visitor to the login screen", async () => {
    render(<App />);

    await waitFor(() => {
      expect(screen.getByRole("heading", { name: "CRM Mobile" })).toBeInTheDocument();
    });
    expect(screen.getByLabelText("Email")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Sign in" })).toBeInTheDocument();
  });

  it("renders the shell with the header and five tabs once a session loads", async () => {
    localStorage.setItem("mobile-access-token", freshAccessToken());
    localStorage.setItem("mobile-refresh-token", "refresh");
    localStorage.setItem(
      "mobile-user",
      JSON.stringify({
        id: "u1",
        firstName: "Ada",
        lastName: "Lovelace",
        email: "ada@example.com",
        mobileNo: "+919876543210",
        gender: "female",
        dob: "1990-01-01",
        createdAt: "2026-01-01T00:00:00.000Z",
      }),
    );

    vi.stubGlobal(
      "fetch",
      vi.fn(async (input: RequestInfo | URL) => {
        const url = String(input);
        const body =
          url.includes("/api/crm/me") ?
            {
              user: { id: "u1", firstName: "Ada", lastName: "Lovelace", email: "ada@example.com", mobileNo: "+91" },
              roles: [{ id: "r1", name: "Admin", slug: "admin" }],
              permissions: ["crm.dashboard.read", "crm.enquiries.read"],
            }
          : { dashboard: {} };

        return new Response(JSON.stringify({ status: true, data: body, message: "Success" }), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        });
      }),
    );

    render(<App />);

    await waitFor(() => {
      expect(screen.getByRole("button", { name: "Open menu" })).toBeInTheDocument();
    });
    expect(screen.getByRole("button", { name: "Create" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Profile" })).toHaveAttribute("href", "/profile");
    expect(within(screen.getByRole("navigation", { name: "Primary" })).getAllByRole("listitem")).toHaveLength(5);

    // Permissions drive the tab bar: Enquiries is allowed here, Calendar is not.
    expect(screen.getByRole("link", { name: "Enquiries" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Calendar" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Booked" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Payments" })).toBeDisabled();
  });
});
