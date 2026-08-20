import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";

const USERS_KEY = "ffp-users-v1";
const SESSION_KEY = "ffp-session-v1";

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  password: string;
  createdAt: string;
}

export type PublicUser = Omit<AuthUser, "password">;

interface AuthContextValue {
  user: PublicUser | null;
  login: (email: string, password: string) => { ok: true } | { ok: false; error: string };
  signup: (name: string, email: string, password: string) => { ok: true } | { ok: false; error: string };
  logout: () => void;
  updateAccount: (updates: { name?: string; email?: string; password?: string }) =>
    | { ok: true }
    | { ok: false; error: string };
}

const AuthContext = createContext<AuthContextValue | null>(null);

function uid() {
  return Math.random().toString(36).slice(2, 12);
}

function toPublic(user: AuthUser): PublicUser {
  const { password: _password, ...rest } = user;
  return rest;
}

function loadUsers(): AuthUser[] {
  try {
    const raw = localStorage.getItem(USERS_KEY);
    if (raw) return JSON.parse(raw) as AuthUser[];
  } catch {
    /* ignore */
  }
  return [];
}

function saveUsers(users: AuthUser[]) {
  localStorage.setItem(USERS_KEY, JSON.stringify(users));
}

function loadSession(): PublicUser | null {
  try {
    const id = localStorage.getItem(SESSION_KEY);
    if (!id) return null;
    const user = loadUsers().find((u) => u.id === id);
    return user ? toPublic(user) : null;
  } catch {
    return null;
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<PublicUser | null>(() => loadSession());

  const login = useCallback((email: string, password: string) => {
    const normalized = email.trim().toLowerCase();
    if (!normalized || !password) {
      return { ok: false as const, error: "Email and password are required" };
    }
    const match = loadUsers().find(
      (u) => u.email === normalized && u.password === password,
    );
    if (!match) {
      return { ok: false as const, error: "Invalid email or password" };
    }
    localStorage.setItem(SESSION_KEY, match.id);
    setUser(toPublic(match));
    return { ok: true as const };
  }, []);

  const signup = useCallback((name: string, email: string, password: string) => {
    const trimmedName = name.trim();
    const normalized = email.trim().toLowerCase();
    if (!trimmedName) return { ok: false as const, error: "Name is required" };
    if (!normalized || !normalized.includes("@")) {
      return { ok: false as const, error: "Enter a valid email" };
    }
    if (password.length < 6) {
      return { ok: false as const, error: "Password must be at least 6 characters" };
    }
    const users = loadUsers();
    if (users.some((u) => u.email === normalized)) {
      return { ok: false as const, error: "An account with this email already exists" };
    }
    const next: AuthUser = {
      id: uid(),
      name: trimmedName,
      email: normalized,
      password,
      createdAt: new Date().toISOString(),
    };
    saveUsers([...users, next]);
    localStorage.setItem(SESSION_KEY, next.id);
    setUser(toPublic(next));
    return { ok: true as const };
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem(SESSION_KEY);
    setUser(null);
  }, []);

  const updateAccount = useCallback(
    (updates: { name?: string; email?: string; password?: string }) => {
      if (!user) return { ok: false as const, error: "Not signed in" };
      const users = loadUsers();
      const idx = users.findIndex((u) => u.id === user.id);
      if (idx < 0) return { ok: false as const, error: "Account not found" };

      const current = users[idx];
      const nextName = updates.name?.trim() ?? current.name;
      const nextEmail = updates.email?.trim().toLowerCase() ?? current.email;
      const nextPassword = updates.password?.length ? updates.password : current.password;

      if (!nextName) return { ok: false as const, error: "Name is required" };
      if (!nextEmail.includes("@")) return { ok: false as const, error: "Enter a valid email" };
      if (updates.password !== undefined && updates.password.length > 0 && updates.password.length < 6) {
        return { ok: false as const, error: "Password must be at least 6 characters" };
      }
      if (users.some((u) => u.email === nextEmail && u.id !== current.id)) {
        return { ok: false as const, error: "That email is already in use" };
      }

      const updated: AuthUser = {
        ...current,
        name: nextName,
        email: nextEmail,
        password: nextPassword,
      };
      users[idx] = updated;
      saveUsers(users);
      setUser(toPublic(updated));
      return { ok: true as const };
    },
    [user],
  );

  const value = useMemo(
    () => ({ user, login, signup, logout, updateAccount }),
    [user, login, signup, logout, updateAccount],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
