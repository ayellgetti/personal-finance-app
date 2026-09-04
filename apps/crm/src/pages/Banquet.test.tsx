/** @vitest-environment jsdom */
import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import Banquet from "./Banquet";

vi.mock("next-themes", () => ({
  useTheme: () => ({ resolvedTheme: "light", setTheme: vi.fn() }),
}));

describe("Banquet walkthrough", () => {
  it("renders the public HTML page in an iframe", () => {
    render(
      <MemoryRouter>
        <Banquet />
      </MemoryRouter>,
    );

    expect(screen.getByTitle("Banquet enquiry to event booking")).toBeInTheDocument();
  });
});
