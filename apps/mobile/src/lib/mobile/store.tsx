import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { ApiError } from "@/lib/api";
import { useAuth } from "@/lib/auth/store";
import { fetchCrmMe } from "@/lib/mobile/remote";
import type { CrmMe } from "@/types/crm";

export type SessionStatus = "idle" | "loading" | "ready" | "forbidden" | "error";

interface MobileContextValue {
  status: SessionStatus;
  me: CrmMe | null;
  permissions: readonly string[];
  errorMessage: string | null;
  reload: () => void;
}

const MobileContext = createContext<MobileContextValue | null>(null);

export function MobileProvider({ children }: { children: ReactNode }) {
  const { user, logout } = useAuth();
  const [status, setStatus] = useState<SessionStatus>(() => (user ? "loading" : "idle"));
  const [me, setMe] = useState<CrmMe | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [reloadToken, setReloadToken] = useState(0);

  useEffect(() => {
    if (!user) {
      setMe(null);
      setErrorMessage(null);
      setStatus("idle");
      return;
    }

    let cancelled = false;
    setStatus("loading");
    setErrorMessage(null);

    void fetchCrmMe()
      .then((session) => {
        if (cancelled) return;
        setMe(session);
        setStatus("ready");
      })
      .catch((error: unknown) => {
        if (cancelled) return;
        if (error instanceof ApiError && error.status === 403) {
          setMe(null);
          setStatus("forbidden");
          return;
        }
        if (error instanceof ApiError && error.status === 401) {
          void logout();
          return;
        }
        setMe(null);
        setStatus("error");
        setErrorMessage(error instanceof Error ? error.message : "Unable to load your CRM session");
      });

    return () => {
      cancelled = true;
    };
  }, [user, logout, reloadToken]);

  const reload = useCallback(() => setReloadToken((token) => token + 1), []);

  const permissions = useMemo(() => me?.permissions ?? [], [me]);

  const value = useMemo(
    () => ({ status, me, permissions, errorMessage, reload }),
    [status, me, permissions, errorMessage, reload],
  );

  return <MobileContext.Provider value={value}>{children}</MobileContext.Provider>;
}

export function useMobile() {
  const ctx = useContext(MobileContext);
  if (!ctx) throw new Error("useMobile must be used within MobileProvider");
  return ctx;
}
