/** @vitest-environment jsdom */
import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import type { Loan } from "@/types/finance";
import { LoanPayoffChart } from "./LoanPayoffChart";

const personal: Loan = {
  id: "personal",
  name: "Personal Loan",
  type: "Personal Loan",
  outstanding: 220_000,
  interestRate: 13.5,
  emi: 11_200,
  remainingTenure: 22,
  emiDay: 5,
  prepaymentAllowed: true,
};

const car: Loan = {
  id: "car",
  name: "Car Loan",
  type: "Vehicle Loan",
  outstanding: 480_000,
  interestRate: 9.2,
  emi: 14_500,
  remainingTenure: 38,
  emiDay: 5,
  prepaymentAllowed: true,
};

describe("LoanPayoffChart", () => {
  beforeEach(() => {
    class ResizeObserverStub {
      observe() {}
      unobserve() {}
      disconnect() {}
    }
    vi.stubGlobal("ResizeObserver", ResizeObserverStub);
  });

  it("renders nothing when there are no active loans", () => {
    const { container } = render(
      <LoanPayoffChart loans={[]} currency="₹" from={new Date(2026, 8, 14)} />,
    );
    expect(container).toBeEmptyDOMElement();
  });

  it("lists each loan with the month it ends", () => {
    render(
      <LoanPayoffChart loans={[personal, car]} currency="₹" from={new Date(2026, 8, 14)} />,
    );

    expect(screen.getByText("When loans end")).toBeInTheDocument();
    expect(screen.getByText(/Personal Loan · /)).toBeInTheDocument();
    expect(screen.getByText(/Car Loan · /)).toBeInTheDocument();
    expect(screen.getByText("Outstanding until close")).toBeInTheDocument();
  });

  it("warns when an EMI cannot close the loan", () => {
    const stuck: Loan = {
      ...personal,
      id: "stuck",
      name: "Stuck Loan",
      emi: 100,
      remainingTenure: 0,
    };
    render(<LoanPayoffChart loans={[stuck]} currency="₹" from={new Date(2026, 8, 14)} />);

    expect(
      screen.getByText(/Stuck Loan EMI does not cover interest, so it will not close on the current payment/),
    ).toBeInTheDocument();
  });
});
