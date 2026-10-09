import { useCallback, useEffect, useRef, useState } from "react";
import { ApiError } from "@/lib/api";
import type { ResourceStatus } from "@/lib/mobile/use-resource";
import type { CrmPaginated } from "@/types/crm";

export type PagedList<T> = {
  status: ResourceStatus;
  items: T[];
  hasMore: boolean;
  loadingMore: boolean;
  errorMessage: string | null;
  loadMore: () => void;
  reload: () => void;
};

/**
 * Accumulates `{ items, pagination }` pages so a phone list grows with a "Load more"
 * tap instead of pulling an unbounded result set on first paint. `signature` is the
 * serialized filter state: changing it restarts from page one.
 */
export function usePagedList<T>(
  load: (page: number) => Promise<CrmPaginated<T>>,
  signature: string,
  enabled = true,
): PagedList<T> {
  const loadRef = useRef(load);
  loadRef.current = load;

  const [status, setStatus] = useState<ResourceStatus>(enabled ? "loading" : "forbidden");
  const [items, setItems] = useState<T[]>([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [reloadToken, setReloadToken] = useState(0);

  useEffect(() => {
    if (!enabled) {
      setStatus("forbidden");
      setItems([]);
      setHasMore(false);
      return;
    }

    let cancelled = false;
    setStatus("loading");
    setErrorMessage(null);

    void loadRef
      .current(1)
      .then((result) => {
        if (cancelled) return;
        setItems(result.items);
        setPage(result.pagination.page);
        setHasMore(result.pagination.hasNextPage);
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
  }, [signature, enabled, reloadToken]);

  const loadMore = useCallback(() => {
    if (loadingMore || !hasMore) return;
    setLoadingMore(true);
    void loadRef
      .current(page + 1)
      .then((result) => {
        setItems((current) => [...current, ...result.items]);
        setPage(result.pagination.page);
        setHasMore(result.pagination.hasNextPage);
      })
      .catch((error: unknown) => {
        setErrorMessage(error instanceof Error ? error.message : "Request failed");
      })
      .finally(() => setLoadingMore(false));
  }, [hasMore, loadingMore, page]);

  const reload = useCallback(() => setReloadToken((token) => token + 1), []);

  return { status, items, hasMore, loadingMore, errorMessage, loadMore, reload };
}
