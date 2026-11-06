/** @vitest-environment jsdom */
import { beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import type { FreedomInputs, FreedomModeView } from "@/lib/finance/calculations";
import type { FreedomScenario } from "@/lib/finance/freedom-scenarios";

const list = vi.fn();
const save = vi.fn();
const remove = vi.fn();
const toastError = vi.fn();

vi.mock("@/lib/finance/freedom-scenarios-remote", () => ({
  listFreedomScenarios: (...a: unknown[]) => list(...a),
  saveFreedomScenario: (...a: unknown[]) => save(...a),
  removeFreedomScenario: (...a: unknown[]) => remove(...a),
}));
vi.mock("sonner", () => ({ toast: { error: (...a: unknown[]) => toastError(...a), success: vi.fn() } }));

const { FreedomScenarios } = await import("./FreedomScenarios");

const input: FreedomInputs = { monthlyExpenses: 70000, currentAge: 32, retirementAge: 55, inflationRate: 6, coastAge: 45, expectedReturn: 11 };
const view: FreedomModeView = {
  mode: "FIRE", target: 90_000_000, targetAge: 55, yearsToTarget: 23,
  projectedCorpus: 40_000_000, shortfall: 50_000_000, requiredMonthlyInvestment: 62000, progressPct: 44,
};
const scenario = (id: string, title: string): FreedomScenario => ({
  id, title, mode: "FIRE", input: { ...input, retirementAge: 60 },
  result: { target: 1, targetAge: 60, yearsToTarget: 28, projectedCorpus: 1, shortfall: 1, requiredMonthlyInvestment: 1, progressPct: 1 },
});

const renderIt = () => render(<FreedomScenarios mode="FIRE" input={input} view={view} currency="₹" />);

describe("FreedomScenarios", () => {
  beforeEach(() => {
    list.mockReset().mockResolvedValue([]);
    save.mockReset().mockResolvedValue(scenario("n", "x"));
    remove.mockReset().mockResolvedValue(undefined);
    toastError.mockReset();
  });

  it("requires a name before saving", async () => {
    renderIt();
    fireEvent.click(await screen.findByRole("button", { name: "Save what-if" }));
    expect(toastError).toHaveBeenCalled();
    expect(save).not.toHaveBeenCalled();
  });

  it("saves the current edit under the typed name", async () => {
    renderIt();
    fireEvent.change(await screen.findByLabelText("Name this what-if"), { target: { value: "Retire at 55" } });
    fireEvent.click(screen.getByRole("button", { name: "Save what-if" }));
    await waitFor(() => expect(save).toHaveBeenCalled());
    expect(save.mock.calls[0]![0]).toMatchObject({ title: "Retire at 55", mode: "FIRE" });
  });

  it("compares saved what-ifs with the current edit and deletes one", async () => {
    list.mockResolvedValue([scenario("a", "Retire at 60")]);
    renderIt();
    expect(await screen.findByText("Retire at 60")).toBeInTheDocument();
    expect(screen.getByText("Retirement age")).toBeInTheDocument();
    expect(screen.getByText("55")).toBeInTheDocument();
    expect(screen.getByText("60")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Delete Retire at 60" }));
    await waitFor(() => expect(remove).toHaveBeenCalledWith("a"));
  });

  it("stops saving at three", async () => {
    list.mockResolvedValue([scenario("a", "A"), scenario("b", "B"), scenario("c", "C")]);
    renderIt();
    expect(await screen.findByText(/Delete one to save another/)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Save what-if" })).toBeDisabled();
  });

  it("blocks saving and says so when the saved list could not be loaded", async () => {
    list.mockRejectedValue(new Error("offline"));
    renderIt();
    expect(await screen.findByText(/Could not load your saved what-ifs/)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Save what-if" })).toBeDisabled();
    expect(screen.queryByText(/Nothing saved yet/)).toBeInTheDocument();
  });
});
