/** @vitest-environment jsdom */
import { beforeEach, describe, expect, it, vi } from "vitest";
import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { isOtpAutoVerifyEnabled } from "@/lib/auth/otp-auto-verify";
import ForgotPassword from "./ForgotPassword";

const requestForgotPasswordOtp = vi.fn();
const resendForgotPasswordOtp = vi.fn();
const verifyForgotPasswordOtp = vi.fn();
const resetPassword = vi.fn();

vi.mock("sonner", () => ({ toast: { success: vi.fn(), error: vi.fn(), message: vi.fn() } }));

vi.mock("@/lib/auth/otp-auto-verify", () => ({
  isOtpAutoVerifyEnabled: vi.fn(() => true),
}));

vi.mock("@/lib/auth/store", () => ({
  useAuth: () => ({
    user: null,
    requestForgotPasswordOtp,
    resendForgotPasswordOtp,
    verifyForgotPasswordOtp,
    resetPassword,
  }),
}));

function renderForgotPassword() {
  return render(
    <MemoryRouter initialEntries={["/forgot-password"]}>
      <Routes>
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/login" element={<div>Sign in screen</div>} />
      </Routes>
    </MemoryRouter>,
  );
}

async function sendOtpForDefaultMobile() {
  fireEvent.change(screen.getByLabelText("Mobile number"), { target: { value: "9876543210" } });
  await act(async () => {
    fireEvent.click(screen.getByRole("button", { name: "Send OTP" }));
  });
}

describe("Forgot password", () => {
  beforeEach(() => {
    vi.mocked(isOtpAutoVerifyEnabled).mockReturnValue(true);
    requestForgotPasswordOtp.mockReset();
    resendForgotPasswordOtp.mockReset();
    verifyForgotPasswordOtp.mockReset();
    resetPassword.mockReset();
  });

  it("skips the OTP screen and opens the password step when generate returns an OTP", async () => {
    requestForgotPasswordOtp.mockResolvedValue({ ok: true, otp: 123456 });
    verifyForgotPasswordOtp.mockResolvedValue({ ok: true });

    renderForgotPassword();
    await sendOtpForDefaultMobile();

    await waitFor(() => {
      expect(requestForgotPasswordOtp).toHaveBeenCalledWith("+919876543210");
      expect(verifyForgotPasswordOtp).toHaveBeenCalledWith("+919876543210", "123456");
    });
    expect(await screen.findByLabelText("New password")).toBeInTheDocument();
    expect(screen.getByLabelText("Confirm password")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Verify OTP" })).not.toBeInTheDocument();
  });

  it("shows the OTP screen when auto-verify is off", async () => {
    vi.mocked(isOtpAutoVerifyEnabled).mockReturnValue(false);
    requestForgotPasswordOtp.mockResolvedValue({ ok: true, otp: 123456 });

    renderForgotPassword();
    await sendOtpForDefaultMobile();

    expect(await screen.findByRole("button", { name: "Verify OTP" })).toBeInTheDocument();
    expect(verifyForgotPasswordOtp).not.toHaveBeenCalled();
    expect(screen.queryByLabelText("New password")).not.toBeInTheDocument();
  });

  it("does not submit when the new passwords do not match", async () => {
    requestForgotPasswordOtp.mockResolvedValue({ ok: true, otp: 123456 });
    verifyForgotPasswordOtp.mockResolvedValue({ ok: true });

    renderForgotPassword();
    await sendOtpForDefaultMobile();
    await screen.findByLabelText("New password");

    fireEvent.change(screen.getByLabelText("New password"), { target: { value: "newpass12" } });
    fireEvent.change(screen.getByLabelText("Confirm password"), { target: { value: "mismatch1" } });
    fireEvent.click(screen.getByRole("button", { name: "Update password" }));

    expect(resetPassword).not.toHaveBeenCalled();
  });

  it("resets the password and returns to sign in", async () => {
    requestForgotPasswordOtp.mockResolvedValue({ ok: true, otp: 123456 });
    verifyForgotPasswordOtp.mockResolvedValue({ ok: true });
    resetPassword.mockResolvedValue({ ok: true });

    renderForgotPassword();
    await sendOtpForDefaultMobile();
    await screen.findByLabelText("New password");

    fireEvent.change(screen.getByLabelText("New password"), { target: { value: "newpass12" } });
    fireEvent.change(screen.getByLabelText("Confirm password"), { target: { value: "newpass12" } });
    fireEvent.click(screen.getByRole("button", { name: "Update password" }));

    await waitFor(() => {
      expect(resetPassword).toHaveBeenCalledWith("+919876543210", "123456", "newpass12");
    });
    expect(await screen.findByText("Sign in screen")).toBeInTheDocument();
  });
});
