import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { CreateFollowUpSheet } from "@/components/forms/CreateFollowUpSheet";
import { CreatePaymentSheet } from "@/components/forms/CreatePaymentSheet";
import { QuickPaymentSheet } from "@/components/forms/QuickPaymentSheet";
import { QuickReminderSheet, type ReminderTarget } from "@/components/forms/QuickReminderSheet";
import { EmptyState, ErrorState, ForbiddenState, LoadingState } from "@/components/PageState";
import type { ChipOption } from "@/components/FilterChips";
import { ViewSwitch } from "@/components/ViewSwitch";
import { FilterSortBar, type FilterSection } from "@/components/FilterSortSheet";
import { MonthNav } from "@/components/MonthNav";
import { ListRow } from "@/components/ListRow";
import { LoadMore } from "@/components/LoadMore";
import { PaymentDetailSheet } from "@/components/records/PaymentDetailSheet";
import { RecordShortcuts } from "@/components/records/RecordShortcuts";
import { Badge } from "@/components/ui/badge";
import { dayKey, monthBounds } from "@/lib/mobile/calendar";
import {
  balanceClass,
  endOfDayIso,
  formatDate,
  formatMoney,
  humanize,
  matchesQuery,
  paymentTypeAccent,
  paymentTypeClass,
  personLine,
} from "@/lib/mobile/format";
import { compareNumber, compareText, compareTime, type SortOrder } from "@/lib/mobile/sort";
import { fetchClient, fetchContactDetail, listClients, listContacts, listPayments } from "@/lib/mobile/remote";
import { useMobile } from "@/lib/mobile/store";
import { useCreateIntent } from "@/lib/mobile/use-create-intent";
import { usePagedList } from "@/lib/mobile/use-paged-list";
import { useResource } from "@/lib/mobile/use-resource";
import { validateDateRange } from "@/lib/mobile/validate";
import {
  CRM_PAYMENT_STATUSES,
  CRM_PAYMENT_TYPES,
  CRM_PERMISSIONS,
  type CrmPayment,
  type CrmPaymentReferenceType,
  type CrmPaymentStatus,
  type CrmPaymentType,
} from "@/types/crm";

type PaymentView = "list" | "cards" | "month";
type PaymentSort = "date" | "amount" | "status";

const PAYMENT_SORTS: { value: PaymentSort; label: string }[] = [
  { value: "date", label: "Date paid" },
  { value: "amount", label: "Amount" },
  { value: "status", label: "Status" },
];

const VIEW_OPTIONS: ChipOption<PaymentView>[] = [
  { value: "list", label: "List" },
  { value: "cards", label: "Cards" },
  { value: "month", label: "Month" },
];

const TYPE_FILTERS: ChipOption<CrmPaymentType | "all">[] = [
  { value: "all", label: "All types" },
  ...CRM_PAYMENT_TYPES.map((type) => ({ value: type, label: type === "INCOME" ? "Income" : "Expense" })),
];

const STATUS_FILTERS: ChipOption<CrmPaymentStatus | "all">[] = [
  { value: "all", label: "All" },
  ...CRM_PAYMENT_STATUSES.map((status) => ({ value: status, label: humanize(status) })),
];

const PAYEE_FILTERS: ChipOption<CrmPaymentReferenceType | "all">[] = [
  { value: "all", label: "Everyone" },
  { value: "client", label: "Booked" },
  { value: "vendor", label: "Vendors" },
];

function totalsByCurrency(payments: readonly CrmPayment[]): { currency: string; income: number; expense: number }[] {
  const totals = new Map<string, { income: number; expense: number }>();
  for (const payment of payments) {
    const entry = totals.get(payment.currency) ?? { income: 0, expense: 0 };
    if (payment.type === "EXPENSE") entry.expense += payment.amount;
    else entry.income += payment.amount;
    totals.set(payment.currency, entry);
  }
  return [...totals.entries()].map(([currency, entry]) => ({ currency, ...entry }));
}

type QuickPayTarget = {
  id: string;
  enquiryId: string | null;
  label: string;
  referenceType: CrmPaymentReferenceType;
};

const TYPE_LABELS: Record<CrmPaymentType, string> = {
  INCOME: "Income",
  EXPENSE: "Expense",
};

function PaymentRow({
  payment,
  payee,
  mobile,
  onOpen,
  onPay,
  onRemind,
  onFollow,
}: {
  payment: CrmPayment;
  payee: string;
  mobile: string | null;
  onOpen: () => void;
  onPay?: () => void;
  onRemind?: () => void;
  onFollow?: () => void;
}) {
  const lead = [mobile, payment.reference].filter(Boolean).join(" · ");
  const trail = [humanize(payment.mode), formatDate(payment.paidAt)].filter(Boolean).join(" · ");

  return (
    <ListRow
      title={payee}
      detail={
        <>
          {lead ? `${lead} · ` : null}
          <span className={paymentTypeClass(payment.type)}>{TYPE_LABELS[payment.type]}</span>
          {trail ? ` · ${trail}` : null}
        </>
      }
      value={formatMoney(payment.amount, payment.currency)}
      valueClassName={paymentTypeClass(payment.type)}
      accentClassName={paymentTypeAccent(payment.type)}
      badge={
        <Badge variant={payment.status === "paid" ? "default" : "secondary"} className="rounded-lg text-[10px]">
          {humanize(payment.status)}
        </Badge>
      }
      onClick={onOpen}
      footer={
        onPay || onRemind || onFollow ? (
          <RecordShortcuts onPay={onPay} onRemind={onRemind} onFollow={onFollow} />
        ) : undefined
      }
    />
  );
}

export default function Payments() {
  const { permissions } = useMobile();
  const canRead = permissions.includes(CRM_PERMISSIONS.paymentsRead);
  const canCreate = permissions.includes(CRM_PERMISSIONS.paymentsCreate);
  const canUpdate = permissions.includes(CRM_PERMISSIONS.paymentsUpdate);
  const canDelete = permissions.includes(CRM_PERMISSIONS.paymentsDelete);
  const canCreateReminder = permissions.includes(CRM_PERMISSIONS.calendarCreate);
  const canCreateFollowUp = permissions.includes(CRM_PERMISSIONS.followUpsCreate);
  const [params, setParams] = useSearchParams();
  const clientId = params.get("client");
  const typeParam = params.get("type");
  const type: CrmPaymentType | "all" = typeParam === "INCOME" || typeParam === "EXPENSE" ? typeParam : "all";
  const setType = (next: CrmPaymentType | "all") => {
    setParams(
      (current) => {
        const nextParams = new URLSearchParams(current);
        if (next === "all") nextParams.delete("type");
        else nextParams.set("type", next);
        return nextParams;
      },
      { replace: true },
    );
  };
  const canReadClients = permissions.includes(CRM_PERMISSIONS.clientsRead);
  const canReadContacts = permissions.includes(CRM_PERMISSIONS.contactsRead);
  const [view, setView] = useState<PaymentView>("list");
  const [status, setStatus] = useState<CrmPaymentStatus | "all">("all");
  const [payee, setPayee] = useState<CrmPaymentReferenceType | "all">("all");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [cursor, setCursor] = useState(() => new Date());
  const [today] = useState(() => new Date());
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState<PaymentSort>("date");
  const [order, setOrder] = useState<SortOrder>("desc");
  const [selected, setSelected] = useState<CrmPayment | null>(null);
  const [editing, setEditing] = useState<CrmPayment | null>(null);
  const [paying, setPaying] = useState<QuickPayTarget | null>(null);
  const [reminding, setReminding] = useState<ReminderTarget | null>(null);
  const [following, setFollowing] = useState<{ id: string; title: string } | null>(null);
  const [createOpen, setCreateOpen] = useCreateIntent(canCreate);
  const [resolvedPayees, setResolvedPayees] = useState<Record<string, { name: string; mobile: string | null }>>({});
  const requestedPayees = useRef(new Set<string>());

  useEffect(() => {
    if (params.get("month") !== "current") return;
    const now = new Date();
    const start = new Date(now.getFullYear(), now.getMonth(), 1);
    const end = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    setFrom(dayKey(start));
    setTo(dayKey(end));
    setParams(
      (current) => {
        const nextParams = new URLSearchParams(current);
        nextParams.delete("month");
        return nextParams;
      },
      { replace: true },
    );
  }, [params, setParams]);

  const rangeError = validateDateRange(from, to);
  const range = useMemo(() => {
    if (view === "month") return monthBounds(cursor);
    if (rangeError) return { from: undefined, to: undefined };
    return {
      from: from ? new Date(`${from}T00:00:00`).toISOString() : undefined,
      to: to ? endOfDayIso(new Date(`${to}T00:00:00`)) : undefined,
    };
  }, [view, cursor, from, to, rangeError]);
  const referenceType = clientId ? "client" : payee === "all" ? undefined : payee;
  const load = useCallback(
    (page: number) =>
      listPayments({
        page,
        limit: view === "month" ? 100 : 20,
        referenceType,
        referenceId: clientId || undefined,
        status: status === "all" ? undefined : status,
        from: range.from,
        to: range.to,
      }),
    [clientId, referenceType, status, range, view],
  );
  const list = usePagedList(
    load,
    `${clientId ?? ""}|${referenceType ?? ""}|${status}|${range.from ?? ""}|${range.to ?? ""}|${view}`,
    canRead,
  );
  const loadClients = useCallback(() => listClients({ page: 1, limit: 100 }), []);
  const loadContacts = useCallback(() => listContacts({ page: 1, limit: 100 }), []);
  const clients = useResource(loadClients, canRead && canReadClients);
  const contacts = useResource(loadContacts, canRead && canReadContacts);

  const payeeKey = (payment: CrmPayment) => `${payment.referenceType}:${payment.referenceId}`;
  const cachedPayee = useCallback(
    (payment: CrmPayment): { name: string; mobile: string | null } | null => {
      if (payment.referenceType === "vendor") {
        const vendor = contacts.data?.items.find((contact) => contact.id === payment.referenceId);
        return vendor ? { name: vendor.name, mobile: vendor.mobile } : null;
      }
      const client = clients.data?.items.find((item) => item.id === payment.referenceId);
      if (!client) return null;
      const contact = contacts.data?.items.find((item) => item.id === client.contactId);
      return { name: contact?.name || client.billingName || "Booked", mobile: contact?.mobile ?? null };
    },
    [clients.data, contacts.data],
  );
  const payeeFor = useCallback(
    (payment: CrmPayment): { name: string; mobile: string | null } =>
      resolvedPayees[payeeKey(payment)] ??
      cachedPayee(payment) ?? { name: payment.referenceType === "vendor" ? "Vendor" : "Booked", mobile: null },
    [cachedPayee, resolvedPayees],
  );

  useEffect(() => {
    const missing = list.items.filter((payment) => {
      const key = payeeKey(payment);
      return !resolvedPayees[key] && !requestedPayees.current.has(key) && !cachedPayee(payment);
    });
    if (missing.length === 0) return;
    for (const payment of missing) requestedPayees.current.add(payeeKey(payment));
    let cancelled = false;
    void (async () => {
      const updates: Record<string, { name: string; mobile: string | null }> = {};
      for (const payment of missing.slice(0, 25)) {
        const key = payeeKey(payment);
        try {
          if (payment.referenceType === "vendor" && canReadContacts) {
            const detail = await fetchContactDetail(payment.referenceId);
            updates[key] = { name: detail.contact.name, mobile: detail.contact.mobile };
          } else if (payment.referenceType === "client" && canReadClients) {
            const client = await fetchClient(payment.referenceId);
            let name = client.billingName || "Booked";
            let mobile: string | null = null;
            if (canReadContacts) {
              const detail = await fetchContactDetail(client.contactId);
              name = detail.contact.name || name;
              mobile = detail.contact.mobile;
            }
            updates[key] = { name, mobile };
          }
        } catch {
          updates[key] = { name: payment.referenceType === "vendor" ? "Vendor" : "Booked", mobile: null };
        }
      }
      if (!cancelled && Object.keys(updates).length > 0) setResolvedPayees((current) => ({ ...current, ...updates }));
    })();
    return () => {
      cancelled = true;
    };
  }, [cachedPayee, canReadClients, canReadContacts, list.items, resolvedPayees]);

  const reminderFor = useCallback(
    (payment: CrmPayment): ReminderTarget => {
      const payee = payeeFor(payment);
      const client =
        payment.referenceType === "client"
          ? clients.data?.items.find((item) => item.id === payment.referenceId)
          : undefined;
      return {
        label: personLine(payee.name, payee.mobile),
        contactId: payment.referenceType === "vendor" ? payment.referenceId : (client?.contactId ?? null),
        enquiryId: payment.enquiryId,
      };
    },
    [clients.data, payeeFor],
  );

  const followFor = useCallback(
    (payment: CrmPayment) => {
      const enquiryId =
        payment.enquiryId ??
        (payment.referenceType === "client"
          ? clients.data?.items.find((item) => item.id === payment.referenceId)?.convertedFromEnquiryId
          : null);
      return enquiryId ? { id: enquiryId, title: payeeFor(payment).name } : null;
    },
    [clients.data, payeeFor],
  );

  const visible = useMemo(() => {
    const filtered = list.items.filter((payment) => {
      if (type !== "all" && payment.type !== type) return false;
      return matchesQuery(
        query,
        formatMoney(payment.amount, payment.currency),
        payment.amount,
        payment.reference,
        payment.status,
        payment.mode,
        payment.type,
        payeeFor(payment).name,
        payeeFor(payment).mobile,
        humanize(payment.status),
        humanize(payment.mode),
        TYPE_LABELS[payment.type],
      );
    });
    return [...filtered].sort((left, right) => {
      if (sort === "amount") return compareNumber(left.amount, right.amount, order);
      if (sort === "status") return compareText(left.status, right.status, order);
      return compareTime(left.paidAt, right.paidAt, order);
    });
  }, [list.items, order, payeeFor, query, sort, type]);
  const filterSections: FilterSection[] = [
    {
      id: "payment-status",
      kind: "single",
      label: "Status",
      value: status,
      neutral: "all",
      options: STATUS_FILTERS,
      onChange: (nextStatus) => setStatus(nextStatus as CrmPaymentStatus | "all"),
    },
    {
      id: "payment-type",
      kind: "single",
      label: "Type",
      value: type,
      neutral: "all",
      options: TYPE_FILTERS,
      onChange: (nextType) => setType(nextType as CrmPaymentType | "all"),
    },
  ];
  if (!clientId) {
    filterSections.push({
      id: "payment-payee",
      kind: "single",
      label: "Payee",
      value: payee,
      neutral: "all",
      options: PAYEE_FILTERS,
      onChange: (nextPayee) => setPayee(nextPayee as CrmPaymentReferenceType | "all"),
    });
  }
  if (view !== "month") {
    filterSections.push({
      id: "payment-dates",
      kind: "dates",
      label: "Dates",
      from,
      to,
      onFromChange: setFrom,
      onToChange: setTo,
      error: rangeError,
    });
  }
  const totals = useMemo(() => totalsByCurrency(visible), [visible]);
  const byDay = useMemo(() => {
    if (view !== "month") return [];
    const groups = new Map<string, CrmPayment[]>();
    const sorted = [...visible].sort(
      (left, right) => new Date(left.paidAt ?? 0).getTime() - new Date(right.paidAt ?? 0).getTime(),
    );
    for (const payment of sorted) {
      const key = payment.paidAt ? formatDate(payment.paidAt) : "Not paid yet";
      groups.set(key, [...(groups.get(key) ?? []), payment]);
    }
    return [...groups.entries()];
  }, [visible, view]);

  if (!canRead) return <ForbiddenState label="payments" />;

  const renderPayment = (payment: CrmPayment) => (
    <PaymentRow
      key={payment.id}
      payment={payment}
      payee={payeeFor(payment).name}
      mobile={payeeFor(payment).mobile}
      onOpen={() => setSelected(payment)}
      onPay={
        canCreate
          ? () =>
              setPaying({
                id: payment.referenceId,
                enquiryId: payment.enquiryId,
                label: personLine(payeeFor(payment).name, payeeFor(payment).mobile),
                referenceType: payment.referenceType,
              })
          : undefined
      }
      onRemind={canCreateReminder ? () => setReminding(reminderFor(payment)) : undefined}
      onFollow={
        canCreateFollowUp && followFor(payment)
          ? () => {
              const follow = followFor(payment);
              if (follow) setFollowing(follow);
            }
          : undefined
      }
    />
  );

  return (
    <div className="space-y-3">
      <FilterSortBar
        views={<ViewSwitch options={VIEW_OPTIONS} value={view} onChange={setView} label="Payment view" />}
        query={query}
        onQuery={setQuery}
        searchPlaceholder="Search loaded payments"
        searchLabel="Search payments"
        sort={sort}
        onSort={(next) => setSort(next as PaymentSort)}
        sortOptions={PAYMENT_SORTS}
        defaultSort="date"
        order={order}
        onOrder={setOrder}
        defaultOrder="desc"
        sections={filterSections}
        resultCount={visible.length}
        singular="payment"
        plural="payments"
        onClear={() => {
          setStatus("all");
          setType("all");
          setPayee("all");
          setFrom("");
          setTo("");
        }}
        onAdd={canCreate ? () => setCreateOpen(true) : undefined}
        addLabel="New"
      />
      {view === "month" ? <MonthNav cursor={cursor} onChange={setCursor} /> : null}

      {list.status === "ready" && totals.length > 0 ? (
        <div aria-label="Loaded totals" className="grid grid-cols-2 gap-2">
          {totals.map((total) => {
            const balance = total.income - total.expense;
            return (
              <div key={total.currency} className="col-span-2 grid grid-cols-2 gap-2">
                <div className="rounded-2xl border border-border bg-card px-4 py-3">
                  <p className="text-xs text-muted-foreground">Income</p>
                  <p className={`text-base font-semibold tabular-nums ${paymentTypeClass("INCOME")}`}>
                    {formatMoney(total.income, total.currency)}
                  </p>
                </div>
                <div className="rounded-2xl border border-border bg-card px-4 py-3">
                  <p className="text-xs text-muted-foreground">Expense</p>
                  <p className={`text-base font-semibold tabular-nums ${paymentTypeClass("EXPENSE")}`}>
                    {formatMoney(total.expense, total.currency)}
                  </p>
                </div>
                <div className="col-span-2 rounded-2xl border border-border bg-card px-4 py-3">
                  <p className="text-xs text-muted-foreground">Balance</p>
                  <p className={`text-base font-semibold tabular-nums ${balanceClass(balance)}`}>
                    {formatMoney(balance, total.currency)}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      ) : null}

      {list.status === "loading" ? <LoadingState label="Loading payments…" /> : null}
      {list.status === "error" ? <ErrorState message={list.errorMessage} onRetry={list.reload} /> : null}
      {list.status === "forbidden" ? <ForbiddenState label="payments" /> : null}
      {list.status === "ready" && visible.length === 0 ? <EmptyState label="No payments found." /> : null}

      {list.status === "ready" && visible.length > 0 && (view === "list" || view === "cards") ? (
        <div className="space-y-2">{visible.map(renderPayment)}</div>
      ) : null}

      {list.status === "ready" && visible.length > 0 && view === "month" ? (
        <div className="space-y-4">
          {byDay.map(([day, payments]) => (
            <section key={day} aria-label={day} className="space-y-2">
              <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{day}</h3>
              {payments.map(renderPayment)}
            </section>
          ))}
        </div>
      ) : null}

      {list.status === "ready" ? (
        <LoadMore hasMore={list.hasMore} loading={list.loadingMore} onLoadMore={list.loadMore} />
      ) : null}

      <PaymentDetailSheet
        payment={selected}
        payee={selected ? payeeFor(selected).name : ""}
        mobile={selected ? payeeFor(selected).mobile : null}
        canUpdate={canUpdate}
        canDelete={canDelete}
        canCreate={canCreate}
        onClose={() => setSelected(null)}
        onEdit={(payment) => {
          setSelected(null);
          setEditing(payment);
        }}
        onAdd={(payment) => {
          const payee = payeeFor(payment);
          setSelected(null);
          setPaying({
            id: payment.referenceId,
            enquiryId: payment.enquiryId,
            label: personLine(payee.name, payee.mobile),
            referenceType: payment.referenceType,
          });
        }}
        onRemind={
          canCreateReminder
            ? (payment) => {
                setSelected(null);
                setReminding(reminderFor(payment));
              }
            : undefined
        }
        onFollow={
          canCreateFollowUp && selected && followFor(selected)
            ? (payment) => {
                const follow = followFor(payment);
                if (!follow) return;
                setSelected(null);
                setFollowing(follow);
              }
            : undefined
        }
        onRemoved={list.reload}
      />
      <QuickReminderSheet
        target={reminding}
        onOpenChange={(next) => {
          if (!next) setReminding(null);
        }}
        onCreated={() => undefined}
      />
      <CreateFollowUpSheet
        open={Boolean(following)}
        enquiry={following}
        stageSet="booked"
        day={today}
        onOpenChange={(next) => {
          if (!next) setFollowing(null);
        }}
        onCreated={() => undefined}
      />
      <QuickPaymentSheet
        client={paying}
        onOpenChange={(next) => {
          if (!next) setPaying(null);
        }}
        onCreated={list.reload}
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
