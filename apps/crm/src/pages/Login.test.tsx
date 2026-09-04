/** @vitest-environment jsdom */
import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import Login from "./Login";

vi.mock("sonner", () => ({ toast: { success: vi.fn(), error: vi.fn(), message: vi.fn() } }));

vi.mock("@/lib/auth/store", () => ({
  useAuth: () => ({
    user: null,
    login: vi.fn(),
  }),
}));

describe("Login public use-case links", () => {
  it("links to banquet, real estate, and Freedom Planner walkthroughs", () => {
    render(
      <MemoryRouter>
        <Login />
      </MemoryRouter>,
    );

    expect(screen.getByRole("link", { name: "Banquet" })).toHaveAttribute("href", "/banquet");
    expect(screen.getByRole("link", { name: "Real estate" })).toHaveAttribute("href", "/real-estate");
    expect(screen.getByRole("link", { name: "Freedom Planner" })).toHaveAttribute("href", "/freedom");
  });
});
