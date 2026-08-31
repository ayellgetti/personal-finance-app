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
  getAccessToken,
  getRefreshToken,
  persistSession,
  readStoredUser,
  subscribeAuth,
  updateStoredUser,
  type AuthSession,
  type StoredUser,
} from "@/lib/auth/session";
import { DEFAULT_COUNTRY_ISO, dialForIso, toE164Mobile } from "@/lib/auth/country-dial-codes";

export { getAccessToken, getRefreshToken } from "@/lib/auth/session";

export type ApiUser = StoredUser;

export type PublicUser = ApiUser & { name: string };

export type SignupDraft = {
  firstName: string;
  lastName: string;
  dob: string;
  gender: string;
  countryIso: string;
  mobileNo: string;
  email: string;
  password: string;
};

export function signupMobileE164(draft: Pick<SignupDraft, "countryIso" | "mobileNo">) {
  return toE164Mobile(draft.countryIso || DEFAULT_COUNTRY_ISO, draft.mobileNo);
}

export function signupCountryDial(draft: Pick<SignupDraft, "countryIso">) {
  return dialForIso(draft.countryIso || DEFAULT_COUNTRY_ISO);
}

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
  requestSignupOtp: (draft: SignupDraft) => Promise<OtpResult>;
  resendSignupOtp: (draft: SignupDraft) => Promise<OtpResult>;
  verifySignupOtp: (mobileNo: string, otp: string) => Promise<AuthResult>;
  completeSignup: (draft: SignupDraft, otp: string) => Promise<AuthResult>;
  requestForgotPasswordOtp: (mobileNo: string) => Promise<OtpResult>;
  resendForgotPasswordOtp: (mobileNo: string) => Promise<OtpResult>;
  verifyForgotPasswordOtp: (mobileNo: string, otp: string) => Promise<AuthResult>;
  resetPassword: (mobileNo: string, otp: string, password: string) => Promise<AuthResult>;
  logout: () => Promise<void>;
  updateAccount: (updates: {
    firstName?: string;
    lastName?: string;
    currentPassword?: string;
    newPassword?: string;
  }) => Promise<AuthResult>;
  completeQuickSetup: () => Promise<AuthResult>;
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

  const login = useCallback(async (email: string, password: string): Promise<AuthResult> => {
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
  }, [applySession]);

  const requestSignupOtp = useCallback(async (draft: SignupDraft): Promise<OtpResult> => {
    try {
      const result = await api<{ otp?: number; delivered?: { email: boolean; sms: boolean } }>(
        "/api/otp/generate",
        {
          method: "POST",
          body: { mobileNo: signupMobileE164(draft), email: draft.email, type: "register" },
        },
      );
      return { ok: true, otp: result.otp, delivered: result.delivered };
    } catch (error) {
      return { ok: false, error: errorMessage(error, "Unable to send OTP") };
    }
  }, []);

  const resendSignupOtp = useCallback(async (draft: SignupDraft): Promise<OtpResult> => {
    try {
      const result = await api<{ otp?: number; delivered?: { email: boolean; sms: boolean } }>(
        "/api/otp/resend",
        {
          method: "POST",
          body: { mobileNo: signupMobileE164(draft), email: draft.email, type: "register" },
        },
      );
      return { ok: true, otp: result.otp, delivered: result.delivered };
    } catch (error) {
      return { ok: false, error: errorMessage(error, "Unable to resend OTP") };
    }
  }, []);

  const verifySignupOtp = useCallback(async (mobileNo: string, otp: string): Promise<AuthResult> => {
    const parsed = parseOtpCode(otp);
    if (parsed.ok === false) return parsed;

    try {
      await api("/api/otp/verify", {
        method: "POST",
        body: { mobileNo, type: "register", no: parsed.no },
      });
      return { ok: true };
    } catch (error) {
      return { ok: false, error: errorMessage(error, "OTP verification failed") };
    }
  }, []);

  const completeSignup = useCallback(
    async (draft: SignupDraft, otp: string): Promise<AuthResult> => {
      const parsed = parseOtpCode(otp);
      if (parsed.ok === false) return parsed;
      const no = parsed.no;

      try {
        await api("/api/otp/verify", {
          method: "POST",
          body: { mobileNo: signupMobileE164(draft), type: "register", no },
        });
      } catch (error) {
        return { ok: false, error: errorMessage(error, "OTP verification failed") };
      }

      try {
        const session = await api<AuthSession>("/api/auth/register", {
          method: "POST",
          body: {
            firstName: draft.firstName,
            lastName: draft.lastName,
            dob: draft.dob,
            gender: draft.gender,
            countryCode: signupCountryDial(draft),
            mobileNo: signupMobileE164(draft),
            email: draft.email,
            password: draft.password,
            no,
          },
        });
        applySession(session);
        return { ok: true };
      } catch (error) {
        return { ok: false, error: errorMessage(error, "Unable to create account") };
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

  const updateAccount = useCallback(
    async (updates: {
      firstName?: string;
      lastName?: string;
      currentPassword?: string;
      newPassword?: string;
    }): Promise<AuthResult> => {
      if (!getAccessToken() && !getRefreshToken()) {
        return { ok: false, error: "Not signed in" };
      }
      if (!user) return { ok: false, error: "Not signed in" };

      try {
        if (updates.firstName || updates.lastName) {
          const result = await api<{ user: ApiUser }>("/api/users/me", {
            method: "PATCH",
            body: {
              ...(updates.firstName ? { firstName: updates.firstName } : {}),
              ...(updates.lastName ? { lastName: updates.lastName } : {}),
            },
          });
          updateStoredUser(result.user);
          setUser(toPublic(result.user));
        }

        if (updates.newPassword) {
          if (!updates.currentPassword) {
            return { ok: false, error: "Current password is required" };
          }
          const result = await api<{ user: ApiUser }>("/api/users/me/password", {
            method: "POST",
            body: {
              currentPassword: updates.currentPassword,
              newPassword: updates.newPassword,
            },
          });
          updateStoredUser(result.user);
          setUser(toPublic(result.user));
        }

        return { ok: true };
      } catch (error) {
        return { ok: false, error: errorMessage(error, "Unable to update account") };
      }
    },
    [user],
  );

  const completeQuickSetup = useCallback(async (): Promise<AuthResult> => {
    if (!getAccessToken() && !getRefreshToken()) {
      return { ok: false, error: "Not signed in" };
    }
    try {
      const result = await api<{ user: ApiUser }>("/api/setup/complete", {
        method: "POST",
      });
      updateStoredUser(result.user);
      setUser(toPublic(result.user));
      return { ok: true };
    } catch (error) {
      return { ok: false, error: errorMessage(error, "Unable to save setup progress") };
    }
  }, []);

  const value = useMemo(
    () => ({
      user,
      login,
      requestSignupOtp,
      resendSignupOtp,
      verifySignupOtp,
      completeSignup,
      requestForgotPasswordOtp,
      resendForgotPasswordOtp,
      verifyForgotPasswordOtp,
      resetPassword,
      logout,
      updateAccount,
      completeQuickSetup,
    }),
    [
      user,
      login,
      requestSignupOtp,
      resendSignupOtp,
      verifySignupOtp,
      completeSignup,
      requestForgotPasswordOtp,
      resendForgotPasswordOtp,
      verifyForgotPasswordOtp,
      resetPassword,
      logout,
      updateAccount,
      completeQuickSetup,
    ],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
