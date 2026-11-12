import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it } from "vitest";
import Home from "./Home";

describe("Home", () => {
  it("presents the marketing site and a link into the product app", () => {
    render(
      <MemoryRouter>
        <Home />
      </MemoryRouter>,
    );

    expect(screen.getByRole("heading", { name: /see your money clearly/i })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: /plan the years that actually matter/i })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: /questions people ask/i })).toBeInTheDocument();
    expect(screen.getAllByRole("link", { name: /open freedom planner/i })[0]).toHaveAttribute(
      "href",
      expect.stringContaining("/login"),
    );
  });

  it("links to the Why, Guide and Course pages", () => {
    render(
      <MemoryRouter>
        <Home />
      </MemoryRouter>,
    );

    expect(screen.getByRole("link", { name: /why it exists/i })).toHaveAttribute("href", "/why");
    expect(screen.getByRole("link", { name: /see a real household/i })).toHaveAttribute("href", "/guide");
    expect(screen.getByRole("link", { name: /learn the course/i })).toHaveAttribute("href", "/course");
  });

  it("shows the trust strip statements", () => {
    render(
      <MemoryRouter>
        <Home />
      </MemoryRouter>,
    );

    expect(
      screen.getByText("This website does not store your finances; your records are kept in your signed-in account."),
    ).toBeInTheDocument();
    expect(screen.getByText("Forecasts are educational, not personal financial advice.")).toBeInTheDocument();
    expect(screen.getByText("No brokerage, no e-filing, no scheme distribution.")).toBeInTheDocument();
  });
});
