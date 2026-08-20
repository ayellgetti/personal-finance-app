import {
  clearSession,
  getAccessToken,
  getRefreshToken,
  isAccessTokenFresh,
  persistSession,
  type AuthSession,
} from "@/lib/auth/session";

export class ApiError extends Error {
  constructor(
    public readonly status: number,
    message: string,
    public readonly data: unknown = null,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

type Envelope<T> = {
  status: boolean;
  data: T;
  message: string;
};

type RequestOptions = Omit<RequestInit, "body" | "headers"> & {
  body?: unknown;
  headers?: HeadersInit;
  token?: string | null;
  skipAuth?: boolean;
};

const AUTH_FREE_PATHS = [
  "/api/auth/login",
  "/api/auth/register",
  "/api/auth/refresh",
  "/api/auth/logout",
  "/api/auth/forgot-password",
];

function isAuthFree(path: string) {
  return AUTH_FREE_PATHS.includes(path) || path.startsWith("/api/otp/");
}

let refreshInFlight: Promise<string | null> | null = null;

async function refreshSession(): Promise<string | null> {
  if (refreshInFlight) return refreshInFlight;

  const refreshToken = getRefreshToken();
  if (!refreshToken) return null;

  refreshInFlight = sendJson<AuthSession>("/api/auth/refresh", {
    method: "POST",
    body: { refreshToken },
  })
    .then((session) => {
      persistSession(session);
      return session.accessToken;
    })
    .catch(() => {
      clearSession();
      return null;
    })
    .finally(() => {
      refreshInFlight = null;
    });

  return refreshInFlight;
}

async function resolveAccessToken(tokenOverride?: string | null): Promise<string | null> {
  const current = tokenOverride ?? getAccessToken();
  if (isAccessTokenFresh(current)) return current;
  const refreshed = await refreshSession();
  return refreshed ?? current;
}

async function sendJson<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const { body, token, skipAuth: _skipAuth, headers: headerInit, ...rest } = options;
  const headers = new Headers(headerInit);
  headers.set("Accept", "application/json");
  if (body !== undefined) {
    headers.set("Content-Type", "application/json");
  }
  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  const response = await fetch(path, {
    ...rest,
    headers,
    body: body === undefined ? undefined : JSON.stringify(body),
  });

  let envelope: Envelope<T> | undefined;
  try {
    envelope = (await response.json()) as Envelope<T>;
  } catch {
    throw new ApiError(response.status, "Unexpected response from the API");
  }

  if (!response.ok || envelope.status === false) {
    throw new ApiError(response.status, envelope.message || "Request failed", envelope.data);
  }

  return envelope.data;
}

export async function api<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const skipAuth = options.skipAuth ?? isAuthFree(path);
  const token = skipAuth ? null : await resolveAccessToken(options.token);

  try {
    return await sendJson<T>(path, { ...options, token });
  } catch (error) {
    const canRetry =
      !skipAuth &&
      error instanceof ApiError &&
      error.status === 401 &&
      Boolean(getRefreshToken());

    if (!canRetry) throw error;

    const nextToken = await refreshSession();
    if (!nextToken) throw error;
    return sendJson<T>(path, { ...options, token: nextToken });
  }
}
