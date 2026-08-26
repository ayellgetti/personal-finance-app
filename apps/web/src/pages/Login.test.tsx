/** @vitest-environment jsdom */
import { describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import Login from "./Login";

const requestSignupOtp = vi.fn();
const verifySignupOtp = vi.fn();

vi.mock("sonner", () => ({ toast: { success: vi.fn(), error: vi.fn(), message: vi.fn() } }));

vi.mock("@/lib/auth/otp-auto-verify", () => ({
  isOtpAutoVerifyEnabled: () => true,
}));

vi.mock("@/lib/auth/store", () => ({
  useAuth: () => ({
    user: null,
    login: vi.fn(),
    requestSignupOtp,
    resendSignupOtp: vi.fn(),
    verifySignupOtp,
    completeSignup: vi.fn(),
  }),
}));

describe("Login signup OTP auto-verify", () => {
  it("skips the OTP screen and opens the password step when generate returns an OTP", async () => {
    requestSignupOtp.mockResolvedValue({ ok: true, otp: 123456 });
    verifySignupOtp.mockResolvedValue({ ok: true });

    render(
      <MemoryRouter>
        <Login />
      </MemoryRouter>,
    );

    fireEvent.click(screen.getByRole("button", { name: "Sign up" }));
    fireEvent.change(screen.getByLabelText("First name"), { target: { value: "Ada" } });
    fireEvent.change(screen.getByLabelText("Last name"), { target: { value: "Lovelace" } });
    fireEvent.change(screen.getByLabelText("Date of birth"), { target: { value: "1990-01-01" } });
    fireEvent.click(screen.getByText("Select"));
    fireEvent.click(screen.getByRole("option", { name: "Female" }));
    fireEvent.change(screen.getByLabelText("Mobile number"), { target: { value: "9876543210" } });
    fireEvent.change(screen.getByLabelText("Email"), { target: { value: "ada@example.com" } });
    fireEvent.click(screen.getByRole("button", { name: "Send OTP" }));

    await waitFor(() => {
      expect(verifySignupOtp).toHaveBeenCalledWith("9876543210", "123456");
    });
    expect(await screen.findByLabelText("Password")).toBeInTheDocument();
    expect(screen.getByLabelText("Confirm password")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Verify OTP" })).not.toBeInTheDocument();
  });
});
