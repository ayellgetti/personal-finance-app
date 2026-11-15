/** @vitest-environment jsdom */
import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import type { SharedPlan as SharedPlanData } from "@/lib/finance/plan-snapshot";

const fetchSharedPlan = vi.fn();
vi.mock("@/lib/finance/plan-share-remote", () => ({ fetchSharedPlan: (...a: unknown[]) => fetchSharedPlan(...a) }));

const { default: SharedPlan } = await import("./SharedPlan");

const plan: SharedPlanData = {
  label: "For my CA",
  expiresAt: "2026-12-08T00:00:00.000Z",
  snapshot: {
    generatedAt: "2026-11-08T10:00:00.000Z",
    currency: "₹",
    netWorth: 250000, assets: 900000, liabilities: 650000, monthlyIncome: 120000, monthlyBills: 70000, savingsRate: 25,
    healthScore: { total: 62, components: [{ label: "Emergency Fund", score: 40, answered: true }, { label: "Diversification", score: 0, answered: false }] },
    emergency: { months: 3.2, targetMonths: 6 },
    freedom: { mode: "FIRE", target: 90_000_000, projectedCorpus: 40_000_000, targetYear: 2049 },
    goals: [{ name: "<img src=x onerror=alert(1)>", type: "Dream Car", targetAmount: 1_000_000, currentSaved: 200_000, status: "At Risk" }],
    nextSteps: [{ title: "Top up your emergency fund", detail: "You have 3.2 months of cover." }],
    cover: { termCurrent: 1_000_000, termRecommended: 5_000_000, healthCurrent: 500_000, healthRecommended: 1_000_000 },
  },
};

const renderAt = (token = "t".repeat(43)) =>
  render(
    <MemoryRouter initialEntries={[`/shared/${token}`]}>
      <Routes>
        <Route path="/shared/:token" element={<SharedPlan />} />
      </Routes>
    </MemoryRouter>,
  );

describe("SharedPlan", () => {
  beforeEach(() => {
    fetchSharedPlan.mockReset();
  });

  it("shows the snapshot as read-only with its dates and a not-advice note", async () => {
    fetchSharedPlan.mockResolvedValue(plan);
    renderAt();
    expect(await screen.findByText("For my CA")).toBeInTheDocument();
    expect(screen.getByText(/read-only snapshot as of/i)).toBeInTheDocument();
    expect(screen.getByText(/This link expires on/)).toBeInTheDocument();
    expect(screen.getByText("62 / 100")).toBeInTheDocument();
    expect(screen.getByText("Not scored yet")).toBeInTheDocument();
    expect(screen.getByText(/not regulated investment or tax advice/)).toBeInTheDocument();
    expect(screen.queryByRole("button")).not.toBeInTheDocument();
  });

  it("passes the token from the URL to the API", async () => {
    fetchSharedPlan.mockResolvedValue(plan);
    const token = "abcdefghij".repeat(4) + "abc";
    renderAt(token);
    await screen.findByText("For my CA");
    expect(fetchSharedPlan).toHaveBeenCalledWith(token);
  });

  it("renders owner-supplied text as text, never as markup", async () => {
    fetchSharedPlan.mockResolvedValue(plan);
    const { container } = renderAt();
    expect(await screen.findByText("<img src=x onerror=alert(1)>")).toBeInTheDocument();
    expect(container.querySelector("img")).toBeNull();
  });

  it("gives one message for any failure, without saying why", async () => {
    fetchSharedPlan.mockRejectedValue(new Error("This link is no longer available"));
    renderAt();
    expect(await screen.findByText("This link is no longer available")).toBeInTheDocument();
    expect(screen.queryByText(/expired/i, { selector: "h1" })).not.toBeInTheDocument();
  });

  it("asks search engines and referrers to stay away while open, and cleans up after", async () => {
    fetchSharedPlan.mockResolvedValue(plan);
    const { unmount } = renderAt();
    await waitFor(() => expect(document.head.querySelector('meta[name="robots"]')).not.toBeNull());
    expect(document.head.querySelector('meta[name="robots"]')?.getAttribute("content")).toContain("noindex");
    expect(document.head.querySelector('meta[name="referrer"]')?.getAttribute("content")).toBe("no-referrer");
    unmount();
    expect(document.head.querySelector('meta[name="robots"]')).toBeNull();
    expect(document.head.querySelector('meta[name="referrer"]')).toBeNull();
  });
});
