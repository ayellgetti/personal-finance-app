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
    expect(screen.getAllByRole("link", { name: /open freedom planner/i })[0]).toHaveAttribute(
      "href",
      expect.stringContaining("/login"),
    );
  });
});
