/** @vitest-environment jsdom */
import { beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { sampleData } from "@/lib/finance/sampleData";
import type { FinanceData } from "@/types/finance";
import type { PlanShare } from "@/lib/finance/plan-snapshot";

let data: FinanceData = sampleData;
const list = vi.fn();
const create = vi.fn();
const revoke = vi.fn();
const toastError = vi.fn();

vi.mock("@/lib/finance/store", () => ({ useFinance: () => ({ data }) }));
vi.mock("@/lib/finance/plan-share-remote", () => ({
  listPlanShares: (...a: unknown[]) => list(...a),
  createPlanShare: (...a: unknown[]) => create(...a),
  revokePlanShare: (...a: unknown[]) => revoke(...a),
}));
vi.mock("sonner", () => ({ toast: { error: (...a: unknown[]) => toastError(...a), success: vi.fn() } }));

const { SharePlanPanel } = await import("./SharePlanPanel");

const share = (id: string, label: string): PlanShare => ({
  id, label, createdAt: "2026-11-08T00:00:00.000Z", expiresAt: "2026-12-08T00:00:00.000Z", viewCount: 2,
});
const TOKEN = "T".repeat(43);

describe("SharePlanPanel", () => {
  beforeEach(() => {
    data = sampleData;
    list.mockReset().mockResolvedValue([]);
    create.mockReset().mockResolvedValue({ token: TOKEN, share: share("n", "For my CA") });
    revoke.mockReset().mockResolvedValue(undefined);
    toastError.mockReset();
  });

  it("asks for income and expenses before offering to share", async () => {
    data = { ...sampleData, incomes: [], expenses: [] };
    render(<SharePlanPanel />);
    expect(await screen.findByText(/Add your income and expenses first/)).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /Create link/ })).not.toBeInTheDocument();
  });

  it("states what is and is not shared", async () => {
    render(<SharePlanPanel />);
    expect(await screen.findByText("What the link shows")).toBeInTheDocument();
    expect(screen.getByText(/never shows your name, email, date of birth/i)).toBeInTheDocument();
  });

  it("needs a name for the recipient before creating", async () => {
    render(<SharePlanPanel />);
    fireEvent.click(await screen.findByRole("button", { name: /Create link/ }));
    expect(toastError).toHaveBeenCalled();
    expect(create).not.toHaveBeenCalled();
  });

  it("sends a snapshot with the chosen expiry and shows the link once", async () => {
    render(<SharePlanPanel />);
    fireEvent.change(await screen.findByLabelText("Who is this for?"), { target: { value: "For my CA" } });
    fireEvent.change(screen.getByLabelText("Expires after"), { target: { value: "7" } });
    fireEvent.click(screen.getByRole("button", { name: /Create link/ }));
    await waitFor(() => expect(create).toHaveBeenCalled());
    const sent = create.mock.calls[0]![0];
    expect(sent).toMatchObject({ label: "For my CA", expiresInDays: 7 });
    expect(sent.snapshot.netWorth).toBe(sent.snapshot.assets - sent.snapshot.liabilities);
    expect(JSON.stringify(sent.snapshot)).not.toContain(sampleData.profile.name);

    const box = (await screen.findByLabelText("Share link")) as HTMLInputElement;
    expect(box.value).toBe(`${window.location.origin}/shared/${TOKEN}`);
    fireEvent.click(screen.getByRole("button", { name: "I have copied it" }));
    expect(screen.queryByLabelText("Share link")).not.toBeInTheDocument();
  });

  it("lists live links with view counts and revokes one", async () => {
    list.mockResolvedValue([share("a", "For my CA")]);
    render(<SharePlanPanel />);
    expect(await screen.findByText("For my CA")).toBeInTheDocument();
    expect(screen.getByText(/opened 2 times/)).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Revoke link for For my CA" }));
    await waitFor(() => expect(revoke).toHaveBeenCalledWith("a"));
  });

  it("stops at five links", async () => {
    list.mockResolvedValue(["a", "b", "c", "d", "e"].map((id) => share(id, `L-${id}`)));
    render(<SharePlanPanel />);
    expect(await screen.findByText(/Revoke one to create another/)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Create link/ })).toBeDisabled();
  });

  it("blocks creating when the list could not be loaded", async () => {
    list.mockRejectedValue(new Error("offline"));
    render(<SharePlanPanel />);
    expect(await screen.findByText(/Could not load your links/)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Create link/ })).toBeDisabled();
  });
});
