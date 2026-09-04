const ACCESS_KEY = "crm-access-token";
const REFRESH_KEY = "crm-refresh-token";
const USER_KEY = "crm-user";

/** Refresh a little before expiry so in-flight requests are not sent with a dead token. */
const ACCESS_REFRESH_SKEW_MS = 30_000;

type AuthListener = () => void;

const listeners = new Set<AuthListener>();

export type StoredUser = {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  countryCode?: string;
  mobileNo: string;
  gender: string;
  dob: string;
  createdAt: string;
};

export type AuthSession = {
  accessToken: string;
  refreshToken: string;
  user: StoredUser;
};

export function getAccessToken() {
  return localStorage.getItem(ACCESS_KEY);
}

export function getRefreshToken() {
  return localStorage.getItem(REFRESH_KEY);
}

export function readStoredUser(): StoredUser | null {
  try {
    const raw = localStorage.getItem(USER_KEY);
    return raw ? (JSON.parse(raw) as StoredUser) : null;
  } catch {
    return null;
  }
}

export function persistSession(session: AuthSession) {
  localStorage.setItem(ACCESS_KEY, session.accessToken);
  localStorage.setItem(REFRESH_KEY, session.refreshToken);
  localStorage.setItem(USER_KEY, JSON.stringify(session.user));
  notifyAuthListeners();
}

export function clearSession() {
  localStorage.removeItem(ACCESS_KEY);
  localStorage.removeItem(REFRESH_KEY);
  localStorage.removeItem(USER_KEY);
  notifyAuthListeners();
}

export function subscribeAuth(listener: AuthListener) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

function notifyAuthListeners() {
  listeners.forEach((listener) => listener());
}

export function isAccessTokenFresh(token: string | null, now = Date.now()): boolean {
  if (!token) return false;
  const expiresAt = readJwtExpiryMs(token);
  if (expiresAt == null) return false;
  return expiresAt - ACCESS_REFRESH_SKEW_MS > now;
}

export function readJwtExpiryMs(token: string): number | null {
  const parts = token.split(".");
  const payloadPart = parts[1];
  if (!payloadPart) return null;
  try {
    const padded = payloadPart.replace(/-/g, "+").replace(/_/g, "/");
    const pad = padded.length % 4 === 0 ? "" : "=".repeat(4 - (padded.length % 4));
    const payload = JSON.parse(atob(padded + pad)) as { exp?: unknown };
    return typeof payload.exp === "number" ? payload.exp * 1000 : null;
  } catch {
    return null;
  }
}
