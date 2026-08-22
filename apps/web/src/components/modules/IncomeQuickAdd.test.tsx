/** @vitest-environment jsdom */
import { describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import { IncomeQuickAdd } from "./IncomeQuickAdd";

vi.mock("sonner", () => ({ toast: { error: vi.fn() } }));

describe("IncomeQuickAdd", () => {
  it("adds an income after picking a source and entering the monthly amount", () => {
    const onAdd = vi.fn();
    render(<IncomeQuickAdd currency="₹" onAdd={onAdd} />);

    fireEvent.click(screen.getByRole("button", { name: "Salary" }));
    fireEvent.change(screen.getByLabelText("Monthly amount"), { target: { value: "150000" } });
    fireEvent.click(screen.getByRole("button", { name: "Add Income" }));

    expect(onAdd).toHaveBeenCalledWith(
      expect.objectContaining({
        name: "Salary",
        type: "Salary",
        monthlyAmount: 150000,
        growthRate: 8,
      }),
    );
  });
});
