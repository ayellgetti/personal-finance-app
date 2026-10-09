import { useCallback, useEffect, useState } from "react";
import { ApiError } from "@/lib/api";

export type ResourceStatus = "idle" | "loading" | "ready" | "forbidden" | "error";

export type Resource<T> = {
  status: ResourceStatus;
  data: T | null;
  errorMessage: string | null;
  reload: () => void;
};

/**
 * Fetches once per tab visit instead of hydrating every module up front, which keeps
 * the first paint cheap on a phone. `enabled` is false while the caller lacks the
 * permission the endpoint requires.
 */
export function useResource<T>(load: () => Promise<T>, enabled = true): Resource<T> {
  const [status, setStatus] = useState<ResourceStatus>(enabled ? "loading" : "forbidden");
  const [data, setData] = useState<T | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [reloadToken, setReloadToken] = useState(0);

  useEffect(() => {
    if (!enabled) {
      setStatus("forbidden");
      setData(null);
      return;
    }

    let cancelled = false;
    setStatus("loading");
    setErrorMessage(null);

    void load()
      .then((result) => {
        if (cancelled) return;
        setData(result);
        setStatus("ready");
      })
      .catch((error: unknown) => {
        if (cancelled) return;
        if (error instanceof ApiError && error.status === 403) {
          setStatus("forbidden");
          return;
        }
        setStatus("error");
        setErrorMessage(error instanceof Error ? error.message : "Request failed");
      });

    return () => {
      cancelled = true;
    };
    // `load` is recreated per render by callers, so the token drives refetching.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled, reloadToken]);

  const reload = useCallback(() => setReloadToken((token) => token + 1), []);

  return { status, data, errorMessage, reload };
}
