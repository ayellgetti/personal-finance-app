/** @vitest-environment jsdom */
import { describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import { LoanQuickAdd } from "./LoanQuickAdd";

vi.mock("sonner", () => ({ toast: { error: vi.fn() } }));

describe("LoanQuickAdd", () => {
  it("adds a loan after picking a type and entering outstanding and EMI", () => {
    const onAdd = vi.fn();
    render(<LoanQuickAdd currency="₹" onAdd={onAdd} />);

    fireEvent.click(screen.getByRole("button", { name: "Home" }));
    fireEvent.change(screen.getByLabelText("Outstanding"), { target: { value: "2500000" } });
    fireEvent.change(screen.getByLabelText("Monthly EMI"), { target: { value: "22000" } });
    fireEvent.click(screen.getByRole("button", { name: "Add Loan" }));

    expect(onAdd).toHaveBeenCalledWith(
      expect.objectContaining({
        name: "Home Loan",
        type: "Home Loan",
        outstanding: 2500000,
        emi: 22000,
        interestRate: 8.5,
        remainingTenure: 240,
        emiDay: 5,
        prepaymentAllowed: true,
      }),
    );
  });
});
