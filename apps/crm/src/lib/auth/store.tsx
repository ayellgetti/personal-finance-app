import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { api, ApiError } from "@/lib/api";
import {
  clearSession,
  getRefreshToken,
  persistSession,
  readStoredUser,
  subscribeAuth,
  type AuthSession,
  type StoredUser,
} from "@/lib/auth/session";

export type ApiUser = StoredUser;

export type PublicUser = ApiUser & { name: string };

type AuthResult = { ok: true } | { ok: false; error: string };

type OtpResult =
  | { ok: true; otp?: number; delivered?: { email: boolean; sms: boolean } }
  | { ok: false; error: string };

const FORGOT_PASSWORD_OTP_TYPE = "forgot-password";

function parseOtpCode(otp: string): { ok: true; no: number } | { ok: false; error: string } {
  const no = Number(otp);
  if (!Number.isInteger(no) || otp.length !== 6) {
    return { ok: false, error: "Enter the 6-digit OTP" };
  }
  return { ok: true, no };
}

interface AuthContextValue {
  user: PublicUser | null;
  login: (email: string, password: string) => Promise<AuthResult>;
  requestForgotPasswordOtp: (mobileNo: string) => Promise<OtpResult>;
  resendForgotPasswordOtp: (mobileNo: string) => Promise<OtpResult>;
  verifyForgotPasswordOtp: (mobileNo: string, otp: string) => Promise<AuthResult>;
  resetPassword: (mobileNo: string, otp: string, password: string) => Promise<AuthResult>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

function toPublic(user: ApiUser): PublicUser {
  return {
    ...user,
    name: `${user.firstName} ${user.lastName}`.trim(),
  };
}

function loadUser(): PublicUser | null {
  const user = readStoredUser();
  return user ? toPublic(user) : null;
}

function errorMessage(error: unknown, fallback: string) {
  if (error instanceof ApiError) return error.message;
  if (error instanceof Error) return error.message;
  return fallback;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<PublicUser | null>(() => loadUser());

  useEffect(() => subscribeAuth(() => setUser(loadUser())), []);

  const applySession = useCallback((session: AuthSession) => {
    persistSession(session);
    setUser(toPublic(session.user));
  }, []);

  const login = useCallback(
    async (email: string, password: string): Promise<AuthResult> => {
      try {
        const session = await api<AuthSession>("/api/auth/login", {
          method: "POST",
          body: { email, password },
        });
        applySession(session);
        return { ok: true };
      } catch (error) {
        return { ok: false, error: errorMessage(error, "Unable to sign in") };
      }
    },
    [applySession],
  );

  const requestForgotPasswordOtp = useCallback(async (mobileNo: string): Promise<OtpResult> => {
    try {
      const result = await api<{ otp?: number; delivered?: { email: boolean; sms: boolean } }>(
        "/api/otp/generate",
        {
          method: "POST",
          body: { mobileNo, type: FORGOT_PASSWORD_OTP_TYPE },
        },
      );
      return { ok: true, otp: result.otp, delivered: result.delivered };
    } catch (error) {
      return { ok: false, error: errorMessage(error, "Unable to send OTP") };
    }
  }, []);

  const resendForgotPasswordOtp = useCallback(async (mobileNo: string): Promise<OtpResult> => {
    try {
      const result = await api<{ otp?: number; delivered?: { email: boolean; sms: boolean } }>(
        "/api/otp/resend",
        {
          method: "POST",
          body: { mobileNo, type: FORGOT_PASSWORD_OTP_TYPE },
        },
      );
      return { ok: true, otp: result.otp, delivered: result.delivered };
    } catch (error) {
      return { ok: false, error: errorMessage(error, "Unable to resend OTP") };
    }
  }, []);

  const verifyForgotPasswordOtp = useCallback(async (mobileNo: string, otp: string): Promise<AuthResult> => {
    const parsed = parseOtpCode(otp);
    if (parsed.ok === false) return parsed;

    try {
      await api("/api/otp/verify", {
        method: "POST",
        body: { mobileNo, type: FORGOT_PASSWORD_OTP_TYPE, no: parsed.no },
      });
      return { ok: true };
    } catch (error) {
      return { ok: false, error: errorMessage(error, "OTP verification failed") };
    }
  }, []);

  const resetPassword = useCallback(
    async (mobileNo: string, otp: string, password: string): Promise<AuthResult> => {
      const parsed = parseOtpCode(otp);
      if (parsed.ok === false) return parsed;
      if (password.length < 8) {
        return { ok: false, error: "Password must be at least 8 characters" };
      }

      try {
        await api("/api/auth/forgot-password", {
          method: "POST",
          body: { mobileNo, no: parsed.no, password },
        });
        return { ok: true };
      } catch (error) {
        return { ok: false, error: errorMessage(error, "Unable to reset password") };
      }
    },
    [],
  );

  const logout = useCallback(async () => {
    const refreshToken = getRefreshToken();
    try {
      if (refreshToken) {
        await api("/api/auth/logout", {
          method: "POST",
          body: { refreshToken },
        });
      }
    } catch {
      // Client session is cleared even if the server session is already gone.
    } finally {
      clearSession();
      setUser(null);
    }
  }, []);

  const value = useMemo(
    () => ({
      user,
      login,
      requestForgotPasswordOtp,
      resendForgotPasswordOtp,
      verifyForgotPasswordOtp,
      resetPassword,
      logout,
    }),
    [
      user,
      login,
      requestForgotPasswordOtp,
      resendForgotPasswordOtp,
      verifyForgotPasswordOtp,
      resetPassword,
      logout,
    ],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
