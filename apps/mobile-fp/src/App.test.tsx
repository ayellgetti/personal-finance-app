/** @vitest-environment jsdom */
import { afterEach, describe, expect, it, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
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
      expect(screen.getByRole("heading", { name: "Freedom Planner Mobile" })).toBeInTheDocument();
    });
    expect(screen.getByLabelText("Email")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Sign in" })).toBeInTheDocument();
  });

  it("renders the finance shell with five tabs and a header profile once a session loads", async () => {
    localStorage.setItem("fp-access-token", freshAccessToken());
    localStorage.setItem("fp-refresh-token", "refresh");
    localStorage.setItem(
      "fp-user",
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
        const emptyPlanner = {
          generatedAt: "2026-01-01T00:00:00.000Z",
          cashflow: {
            income: 0, salary: 0, rental: 0, livingExpenses: 0, loanEmis: 0,
            investments: 0, totalOutflow: 0, surplus: 0, savingsRatePct: null,
            discretionary: 0, incomeRecorded: false, sipsOnHold: false, pausedSip: 0,
            outflowLines: [],
          },
          netWorth: { investmentCorpus: 0, liabilities: 0, netExcludingProperty: 0, remainingInterestEstimate: 0 },
          goals: {
            fireType: null, fireTarget: 0, fireCorpus: 0, fireProgressPct: 0,
            allGoalsTarget: 0, projectedCorpusAtFireYear: 0, fireGap: 0, items: [], emergencyFund: null,
          },
          liabilityPlan: { avalanche: [] },
          recommendations: [],
        };
        const body = url.includes("/api/financial-profile")
          ? { financialProfile: null }
          : url.includes("/api/planner/report")
            ? { report: emptyPlanner }
            : { items: [] };

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
    expect(screen.getAllByRole("listitem")).toHaveLength(5);
    expect(screen.getByRole("link", { name: "My Plan" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "AI Advisor" })).toBeInTheDocument();
  });
});
