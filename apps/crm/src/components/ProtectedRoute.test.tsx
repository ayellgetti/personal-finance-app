/** @vitest-environment jsdom */
import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { ProtectedRoute } from "@/components/ProtectedRoute";

vi.mock("@/lib/auth/store", () => ({
  useAuth: () => ({ user: null }),
}));

describe("ProtectedRoute", () => {
  it("redirects to login when the session is missing", () => {
    render(
      <MemoryRouter initialEntries={["/"]}>
        <Routes>
          <Route path="/login" element={<div>Login page</div>} />
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <div>CRM home</div>
              </ProtectedRoute>
            }
          />
        </Routes>
      </MemoryRouter>,
    );

    expect(screen.getByText("Login page")).toBeInTheDocument();
    expect(screen.queryByText("CRM home")).not.toBeInTheDocument();
  });
});
