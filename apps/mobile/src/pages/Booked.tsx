import { useCallback, useMemo, useState } from "react";
import { EmptyState, ErrorState, ForbiddenState, LoadingState } from "@/components/PageState";
import { LoadMore } from "@/components/LoadMore";
import { SearchBar } from "@/components/SearchBar";
import { Badge } from "@/components/ui/badge";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { formatDate, humanize } from "@/lib/mobile/format";
import { listClients } from "@/lib/mobile/remote";
import { useMobile } from "@/lib/mobile/store";
import { useDebounced } from "@/lib/mobile/use-debounced";
import { usePagedList } from "@/lib/mobile/use-paged-list";
import { CRM_PERMISSIONS, type CrmClient } from "@/types/crm";

function ClientRow({ client, onOpen }: { client: CrmClient; onOpen: () => void }) {
  return (
    <button
      type="button"
      onClick={onOpen}
      className="flex w-full items-center gap-3 rounded-2xl border border-l-4 border-border border-l-emerald-500 bg-card px-4 py-3 text-left shadow-[var(--shadow-card)] transition-colors hover:bg-secondary tap-highlight-none"
    >
      <span className="min-w-0 flex-1">
        <span className="block truncate text-sm font-semibold">{client.billingName}</span>
        <span className="block truncate text-xs text-muted-foreground">
          {formatDate(client.startsAt)} – {formatDate(client.endsAt)}
        </span>
      </span>
      <Badge variant="secondary" className="shrink-0 rounded-lg bg-emerald-500/15 text-[10px] text-emerald-700 dark:text-emerald-300">
        {humanize(client.status)}
      </Badge>
    </button>
  );
}

function ClientDetailSheet({ client, onClose }: { client: CrmClient | null; onClose: () => void }) {
  return (
    <Sheet open={Boolean(client)} onOpenChange={(next) => (next ? undefined : onClose())}>
      <SheetContent side="bottom" className="rounded-t-3xl pb-safe">
        {client ? (
          <div className="mx-auto w-full max-w-md space-y-4 pb-4">
            <SheetHeader className="text-left">
              <SheetTitle className="font-display text-lg">{client.billingName}</SheetTitle>
              <SheetDescription>{humanize(client.status)}</SheetDescription>
            </SheetHeader>
            <dl className="divide-y divide-border rounded-2xl border border-border bg-card px-4">
              <div className="flex justify-between gap-3 py-2.5">
                <dt className="text-xs uppercase tracking-wide text-muted-foreground">Starts</dt>
                <dd className="truncate text-sm font-medium">{formatDate(client.startsAt)}</dd>
              </div>
              <div className="flex justify-between gap-3 py-2.5">
                <dt className="text-xs uppercase tracking-wide text-muted-foreground">Ends</dt>
                <dd className="truncate text-sm font-medium">{formatDate(client.endsAt)}</dd>
              </div>
              <div className="flex justify-between gap-3 py-2.5">
                <dt className="text-xs uppercase tracking-wide text-muted-foreground">GSTIN</dt>
                <dd className="truncate text-sm font-medium">{client.gstin || "—"}</dd>
              </div>
            </dl>
          </div>
        ) : null}
      </SheetContent>
    </Sheet>
  );
}

export default function Booked() {
  const { permissions } = useMobile();
  const canRead = permissions.includes(CRM_PERMISSIONS.clientsRead);
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<CrmClient | null>(null);
  const search = useDebounced(query, 300);

  const load = useCallback(
    (page: number) => listClients({ page, limit: 20, search: search || undefined }),
    [search],
  );
  const signature = useMemo(() => search, [search]);
  const list = usePagedList(load, signature, canRead);

  if (!canRead) return <ForbiddenState label="booked clients" />;

  return (
    <div className="space-y-3">
      <SearchBar value={query} onChange={setQuery} placeholder="Search bookings" label="Search bookings" />

      {list.status === "loading" ? <LoadingState label="Loading bookings…" /> : null}
      {list.status === "error" ? <ErrorState message={list.errorMessage} onRetry={list.reload} /> : null}
      {list.status === "ready" && list.items.length === 0 ? <EmptyState label="No bookings found." /> : null}

      {list.status === "ready" && list.items.length > 0 ? (
        <div className="space-y-2">
          {list.items.map((client) => (
            <ClientRow key={client.id} client={client} onOpen={() => setSelected(client)} />
          ))}
          <LoadMore hasMore={list.hasMore} loading={list.loadingMore} onLoadMore={list.loadMore} />
        </div>
      ) : null}

      <ClientDetailSheet client={selected} onClose={() => setSelected(null)} />
    </div>
  );
}
