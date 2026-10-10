import { useCallback, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { toast } from "sonner";
import { CreatePaymentSheet } from "@/components/forms/CreatePaymentSheet";
import { EmptyState, ErrorState, ForbiddenState, LoadingState } from "@/components/PageState";
import { ListRow } from "@/components/ListRow";
import { LoadMore } from "@/components/LoadMore";
import { SearchBar } from "@/components/SearchBar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { formatDate, formatMoney, humanize, matchesQuery } from "@/lib/mobile/format";
import { listClients, listContacts, listPayments, removePayment } from "@/lib/mobile/remote";
import { useMobile } from "@/lib/mobile/store";
import { useCreateIntent } from "@/lib/mobile/use-create-intent";
import { usePagedList } from "@/lib/mobile/use-paged-list";
import { useResource } from "@/lib/mobile/use-resource";
import { CRM_PERMISSIONS, type CrmPayment, type CrmPaymentType } from "@/types/crm";

const TYPE_LABELS: Record<CrmPaymentType, string> = {
  INCOME: "Income",
  EXPENSE: "Expense",
};

function PaymentRow({
  payment,
  payee,
  onOpen,
}: {
  payment: CrmPayment;
  payee: string;
  onOpen: () => void;
}) {
  const detail = [payment.reference, TYPE_LABELS[payment.type], humanize(payment.mode), formatDate(payment.paidAt)]
    .filter(Boolean)
    .join(" · ");

  return (
    <ListRow
      title={payee}
      detail={detail}
      value={formatMoney(payment.amount, payment.currency)}
      badge={
        <Badge variant={payment.status === "paid" ? "default" : "secondary"} className="rounded-lg text-[10px]">
          {humanize(payment.status)}
        </Badge>
      }
      onClick={onOpen}
    />
  );
}

function PaymentDetailSheet({
  payment,
  canUpdate,
  canDelete,
  onClose,
  onEdit,
  onRemoved,
}: {
  payment: CrmPayment | null;
  canUpdate: boolean;
  canDelete: boolean;
  onClose: () => void;
  onEdit: (payment: CrmPayment) => void;
  onRemoved: () => void;
}) {
  const [confirmRemove, setConfirmRemove] = useState(false);
  const [busy, setBusy] = useState(false);

  const remove = async () => {
    if (!payment) return;
    setBusy(true);
    try {
      await removePayment(payment.id);
      toast.success("Payment removed");
      setConfirmRemove(false);
      onClose();
      onRemoved();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to remove payment");
    } finally {
      setBusy(false);
    }
  };

  return (
    <Sheet
      open={Boolean(payment)}
      onOpenChange={(next) => {
        if (!next) {
          setConfirmRemove(false);
          onClose();
        }
      }}
    >
      <SheetContent side="bottom" className="max-h-[92vh] overflow-y-auto rounded-t-3xl pb-safe">
        {payment ? (
          <div className="mx-auto w-full max-w-tablet space-y-4 pb-4">
            <SheetHeader className="text-left">
              <div className="flex items-start justify-between gap-3 pr-8">
                <div className="min-w-0 space-y-1">
                  <SheetTitle className="font-display text-lg">
                    {formatMoney(payment.amount, payment.currency)}
                  </SheetTitle>
                  <SheetDescription>{humanize(payment.referenceType)}</SheetDescription>
                </div>
                <Badge variant={payment.status === "paid" ? "default" : "secondary"} className="shrink-0 rounded-full">
                  {humanize(payment.status)}
                </Badge>
              </div>
            </SheetHeader>
            <dl className="grid grid-cols-2 gap-x-4 gap-y-3">
              <div>
                <dt className="text-xs text-muted-foreground">Type</dt>
                <dd className="mt-0.5 text-sm font-medium">{humanize(payment.type)}</dd>
              </div>
              <div>
                <dt className="text-xs text-muted-foreground">Mode</dt>
                <dd className="mt-0.5 text-sm font-medium">{humanize(payment.mode)}</dd>
              </div>
              <div>
                <dt className="text-xs text-muted-foreground">Paid at</dt>
                <dd className="mt-0.5 text-sm font-medium">{formatDate(payment.paidAt)}</dd>
              </div>
              <div>
                <dt className="text-xs text-muted-foreground">Reference</dt>
                <dd className="mt-0.5 break-words text-sm font-medium">{payment.reference || "—"}</dd>
              </div>
            </dl>
            {confirmRemove ? (
              <div className="space-y-3 rounded-2xl border border-border p-3">
                <p className="text-sm">Remove this payment?</p>
                <div className="flex gap-2">
                  <Button type="button" variant="outline" className="rounded-xl" disabled={busy} onClick={() => setConfirmRemove(false)}>
                    Cancel
                  </Button>
                  <Button type="button" variant="destructive" className="rounded-xl" disabled={busy} onClick={() => void remove()}>
                    Remove
                  </Button>
                </div>
              </div>
            ) : (
              <div className="flex flex-wrap gap-2">
                {canUpdate ? (
                  <Button type="button" size="sm" variant="outline" className="rounded-xl" onClick={() => onEdit(payment)}>
                    Edit
                  </Button>
                ) : null}
                {canDelete ? (
                  <Button type="button" size="sm" variant="outline" className="rounded-xl text-destructive" onClick={() => setConfirmRemove(true)}>
                    Remove
                  </Button>
                ) : null}
              </div>
            )}
          </div>
        ) : null}
      </SheetContent>
    </Sheet>
  );
}

export default function Payments() {
  const { permissions } = useMobile();
  const canRead = permissions.includes(CRM_PERMISSIONS.paymentsRead);
  const canCreate = permissions.includes(CRM_PERMISSIONS.paymentsCreate);
  const canUpdate = permissions.includes(CRM_PERMISSIONS.paymentsUpdate);
  const canDelete = permissions.includes(CRM_PERMISSIONS.paymentsDelete);
  const [params] = useSearchParams();
  const clientId = params.get("client");
  const canReadClients = permissions.includes(CRM_PERMISSIONS.clientsRead);
  const canReadContacts = permissions.includes(CRM_PERMISSIONS.contactsRead);
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<CrmPayment | null>(null);
  const [editing, setEditing] = useState<CrmPayment | null>(null);
  const [createOpen, setCreateOpen] = useCreateIntent(canCreate);

  const load = useCallback(
    (page: number) =>
      listPayments({
        page,
        limit: 20,
        referenceType: clientId ? "client" : undefined,
        referenceId: clientId || undefined,
      }),
    [clientId],
  );
  const list = usePagedList(load, clientId ?? "payments", canRead);
  const loadClients = useCallback(() => listClients({ page: 1, limit: 100 }), []);
  const loadVendors = useCallback(() => listContacts({ page: 1, limit: 100, type: "vendor" }), []);
  const clients = useResource(loadClients, canRead && canReadClients);
  const vendors = useResource(loadVendors, canRead && canReadContacts);

  const payeeFor = useCallback(
    (payment: CrmPayment) => {
      if (payment.referenceType === "vendor") {
        return vendors.data?.items.find((contact) => contact.id === payment.referenceId)?.name ?? "Vendor";
      }
      return clients.data?.items.find((client) => client.id === payment.referenceId)?.billingName ?? "Booked";
    },
    [clients.data, vendors.data],
  );

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
          payeeFor(payment),
          humanize(payment.status),
          humanize(payment.mode),
          TYPE_LABELS[payment.type],
        ),
      ),
    [list.items, payeeFor, query],
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
            <PaymentRow
              key={payment.id}
              payment={payment}
              payee={payeeFor(payment)}
              onOpen={() => setSelected(payment)}
            />
          ))}
          <LoadMore hasMore={list.hasMore} loading={list.loadingMore} onLoadMore={list.loadMore} />
        </div>
      ) : null}

      <PaymentDetailSheet
        payment={selected}
        canUpdate={canUpdate}
        canDelete={canDelete}
        onClose={() => setSelected(null)}
        onEdit={(payment) => {
          setSelected(null);
          setEditing(payment);
        }}
        onRemoved={list.reload}
      />
      <CreatePaymentSheet open={createOpen} onOpenChange={setCreateOpen} onCreated={list.reload} />
      <CreatePaymentSheet
        open={Boolean(editing)}
        payment={editing}
        onOpenChange={(next) => {
          if (!next) setEditing(null);
        }}
        onCreated={list.reload}
      />
    </div>
  );
}
