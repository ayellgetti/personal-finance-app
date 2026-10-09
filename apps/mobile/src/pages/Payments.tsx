import { useCallback, useMemo, useState } from "react";
import { EmptyState, ErrorState, ForbiddenState, LoadingState } from "@/components/PageState";
import { LoadMore } from "@/components/LoadMore";
import { SearchBar } from "@/components/SearchBar";
import { Badge } from "@/components/ui/badge";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { formatDate, formatMoney, humanize, matchesQuery } from "@/lib/mobile/format";
import { listPayments } from "@/lib/mobile/remote";
import { useMobile } from "@/lib/mobile/store";
import { usePagedList } from "@/lib/mobile/use-paged-list";
import { CRM_PERMISSIONS, type CrmPayment } from "@/types/crm";

function PaymentRow({ payment, onOpen }: { payment: CrmPayment; onOpen: () => void }) {
  return (
    <button
      type="button"
      onClick={onOpen}
      className="flex w-full items-center gap-3 rounded-2xl border border-border bg-card px-4 py-3 text-left shadow-[var(--shadow-card)] transition-colors hover:bg-secondary tap-highlight-none"
    >
      <span className="min-w-0 flex-1">
        <span className="block truncate text-sm font-semibold">
          {formatMoney(payment.amount, payment.currency)}
        </span>
        <span className="block truncate text-xs text-muted-foreground">
          {humanize(payment.mode)} · {formatDate(payment.paidAt)}
        </span>
      </span>
      <Badge variant={payment.status === "paid" ? "default" : "secondary"} className="shrink-0 rounded-lg text-[10px]">
        {humanize(payment.status)}
      </Badge>
    </button>
  );
}

function PaymentDetailSheet({ payment, onClose }: { payment: CrmPayment | null; onClose: () => void }) {
  return (
    <Sheet open={Boolean(payment)} onOpenChange={(next) => (next ? undefined : onClose())}>
      <SheetContent side="bottom" className="rounded-t-3xl pb-safe">
        {payment ? (
          <div className="mx-auto w-full max-w-md space-y-4 pb-4">
            <SheetHeader className="text-left">
              <SheetTitle className="font-display text-lg">
                {formatMoney(payment.amount, payment.currency)}
              </SheetTitle>
              <SheetDescription>
                {humanize(payment.type)} · {humanize(payment.status)}
              </SheetDescription>
            </SheetHeader>
            <dl className="divide-y divide-border rounded-2xl border border-border bg-card px-4">
              <div className="flex justify-between gap-3 py-2.5">
                <dt className="text-xs uppercase tracking-wide text-muted-foreground">Mode</dt>
                <dd className="truncate text-sm font-medium">{humanize(payment.mode)}</dd>
              </div>
              <div className="flex justify-between gap-3 py-2.5">
                <dt className="text-xs uppercase tracking-wide text-muted-foreground">Paid</dt>
                <dd className="truncate text-sm font-medium">{formatDate(payment.paidAt)}</dd>
              </div>
              <div className="flex justify-between gap-3 py-2.5">
                <dt className="text-xs uppercase tracking-wide text-muted-foreground">Reference</dt>
                <dd className="truncate text-sm font-medium">{payment.reference || "—"}</dd>
              </div>
              <div className="flex justify-between gap-3 py-2.5">
                <dt className="text-xs uppercase tracking-wide text-muted-foreground">Against</dt>
                <dd className="truncate text-sm font-medium">{humanize(payment.referenceType)}</dd>
              </div>
            </dl>
          </div>
        ) : null}
      </SheetContent>
    </Sheet>
  );
}

export default function Payments() {
  const { permissions } = useMobile();
  const canRead = permissions.includes(CRM_PERMISSIONS.paymentsRead);
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<CrmPayment | null>(null);

  const load = useCallback((page: number) => listPayments({ page, limit: 20 }), []);
  const list = usePagedList(load, "payments", canRead);

  const visible = useMemo(
    () =>
      list.items.filter((payment) =>
        matchesQuery(
          query,
          formatMoney(payment.amount, payment.currency),
          payment.amount,
          payment.reference,
          payment.status,
          payment.mode,
          payment.type,
          humanize(payment.status),
          humanize(payment.mode),
        ),
      ),
    [list.items, query],
  );

  if (!canRead) return <ForbiddenState label="payments" />;

  return (
    <div className="space-y-3">
      <SearchBar value={query} onChange={setQuery} placeholder="Search payments" label="Search payments" />

      {list.status === "loading" ? <LoadingState label="Loading payments…" /> : null}
      {list.status === "error" ? <ErrorState message={list.errorMessage} onRetry={list.reload} /> : null}
      {list.status === "ready" && visible.length === 0 ? <EmptyState label="No payments found." /> : null}

      {list.status === "ready" && visible.length > 0 ? (
        <div className="space-y-2">
          {visible.map((payment) => (
            <PaymentRow key={payment.id} payment={payment} onOpen={() => setSelected(payment)} />
          ))}
          <LoadMore hasMore={list.hasMore} loading={list.loadingMore} onLoadMore={list.loadMore} />
        </div>
      ) : null}

      <PaymentDetailSheet payment={selected} onClose={() => setSelected(null)} />
    </div>
  );
}
