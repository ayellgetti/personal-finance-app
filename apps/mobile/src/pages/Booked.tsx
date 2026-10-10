import { useCallback, useMemo, useState } from "react";
import { EmptyState, ErrorState, ForbiddenState, LoadingState } from "@/components/PageState";
import type { ChipOption } from "@/components/FilterChips";
import { AddButton, ViewSwitch } from "@/components/ViewSwitch";
import { FilterSortBar, type FilterSection } from "@/components/FilterSortSheet";
import { MonthNav } from "@/components/MonthNav";
import { CreateClientSheet } from "@/components/forms/CreateClientSheet";
import { CreateFollowUpSheet } from "@/components/forms/CreateFollowUpSheet";
import { EditClientSheet } from "@/components/forms/EditClientSheet";
import { QuickPaymentSheet } from "@/components/forms/QuickPaymentSheet";
import { QuickReminderSheet, type ReminderTarget } from "@/components/forms/QuickReminderSheet";
import { ClientDetailSheet } from "@/components/records/ClientDetailSheet";
import { RecordShortcuts } from "@/components/records/RecordShortcuts";
import { ListRow } from "@/components/ListRow";
import { LoadMore } from "@/components/LoadMore";
import { Badge } from "@/components/ui/badge";
import { monthBounds } from "@/lib/mobile/calendar";
import { endOfDayIso, formatDate, formatDateTime, formatTime, humanize, personLine } from "@/lib/mobile/format";
import { compareText, compareTime, type SortOrder } from "@/lib/mobile/sort";
import { listClients, listContacts, listEnquiries } from "@/lib/mobile/remote";
import { useMobile } from "@/lib/mobile/store";
import { useCreateIntent } from "@/lib/mobile/use-create-intent";
import { useDebounced } from "@/lib/mobile/use-debounced";
import { usePagedList } from "@/lib/mobile/use-paged-list";
import { useResource } from "@/lib/mobile/use-resource";
import { validateDateRange } from "@/lib/mobile/validate";
import { CRM_CLIENT_STATUSES, CRM_PERMISSIONS, type CrmClient, type CrmClientStatus } from "@/types/crm";

type BookedView = "list" | "cards" | "month";
type BookedSort = "date" | "name" | "status";

const BOOKED_SORTS: { value: BookedSort; label: string }[] = [
  { value: "date", label: "Event date" },
  { value: "name", label: "Name" },
  { value: "status", label: "Status" },
];

const VIEW_OPTIONS: ChipOption<BookedView>[] = [
  { value: "list", label: "List" },
  { value: "cards", label: "Cards" },
  { value: "month", label: "Month" },
];

const STATUS_FILTERS: ChipOption<CrmClientStatus | "all">[] = [
  { value: "all", label: "All" },
  ...CRM_CLIENT_STATUSES.map((status) => ({ value: status, label: humanize(status) })),
];

function localDayStartIso(key: string): string {
  return new Date(`${key}T00:00:00`).toISOString();
}

function localDayEndIso(key: string): string {
  return endOfDayIso(new Date(`${key}T00:00:00`));
}

function bookingParts(startsAt: string | null, endsAt: string | null): { value: string; when: string | null } {
  if (!startsAt) return { value: "Dates not set", when: null };
  if (!endsAt) return { value: formatDate(startsAt), when: formatTime(startsAt) };
  const start = new Date(startsAt);
  const end = new Date(endsAt);
  if (start.toDateString() === end.toDateString()) {
    return { value: formatDate(startsAt), when: `${formatTime(startsAt)} – ${formatTime(endsAt)}` };
  }
  return { value: formatDate(startsAt), when: `Until ${formatDateTime(endsAt)}` };
}

function ClientRow({
  client,
  contactName,
  contactMobile,
  enquiryTitle,
  onOpen,
  onPay,
  onRemind,
  onFollow,
}: {
  client: CrmClient;
  contactName: string | null;
  contactMobile: string | null;
  enquiryTitle: string | null;
  onOpen: () => void;
  onPay?: () => void;
  onRemind?: () => void;
  onFollow?: () => void;
}) {
  const { value, when } = bookingParts(client.startsAt, client.endsAt);
  const billing = contactName && contactName !== client.billingName ? client.billingName : null;
  const detail = [contactMobile, billing, when, enquiryTitle, client.gstin].filter(Boolean).join(" · ");

  return (
    <ListRow
      title={contactName || client.billingName}
      detail={detail || null}
      value={value}
      badge={
        <Badge variant="secondary" className="rounded-lg bg-emerald-500/15 text-[10px] text-emerald-700 dark:text-emerald-300">
          {humanize(client.status)}
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

export default function Booked() {
  const { permissions } = useMobile();
  const canRead = permissions.includes(CRM_PERMISSIONS.clientsRead);
  const canReadContacts = permissions.includes(CRM_PERMISSIONS.contactsRead);
  const canReadEnquiries = permissions.includes(CRM_PERMISSIONS.enquiriesRead);
  const canCreatePayment = permissions.includes(CRM_PERMISSIONS.paymentsCreate);
  const canCreateReminder = permissions.includes(CRM_PERMISSIONS.calendarCreate);
  const canCreateFollowUp = permissions.includes(CRM_PERMISSIONS.followUpsCreate);
  const canCreate = permissions.includes(CRM_PERMISSIONS.clientsCreate);
  const [view, setView] = useState<BookedView>("list");
  const [status, setStatus] = useState<CrmClientStatus | "all">("all");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [cursor, setCursor] = useState(() => new Date());
  const [createOpen, setCreateOpen] = useCreateIntent(canCreate);
  const [today] = useState(() => new Date());
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState<BookedSort>("date");
  const [order, setOrder] = useState<SortOrder>("asc");
  const [selected, setSelected] = useState<CrmClient | null>(null);
  const [editing, setEditing] = useState<CrmClient | null>(null);
  const [paying, setPaying] = useState<CrmClient | null>(null);
  const [reminding, setReminding] = useState<ReminderTarget | null>(null);
  const [following, setFollowing] = useState<{ id: string; title: string } | null>(null);
  const search = useDebounced(query, 300);

  const rangeError = validateDateRange(from, to);
  const range = useMemo(() => {
    if (view === "month") return monthBounds(cursor);
    if (rangeError) return { from: undefined, to: undefined };
    return {
      from: from ? localDayStartIso(from) : undefined,
      to: to ? localDayEndIso(to) : undefined,
    };
  }, [view, cursor, from, to, rangeError]);
  const load = useCallback(
    (page: number) =>
      listClients({
        page,
        limit: view === "month" ? 100 : 20,
        search: search || undefined,
        status: status === "all" ? undefined : status,
        from: range.from,
        to: range.to,
      }),
    [search, status, range, view],
  );
  const signature = useMemo(
    () => `${search}|${status}|${range.from ?? ""}|${range.to ?? ""}|${view}`,
    [search, status, range, view],
  );
  const list = usePagedList(load, signature, canRead);
  const filterSections = useMemo(() => {
    const next: FilterSection[] = [
      {
        id: "status",
        kind: "single",
        label: "Status",
        value: status,
        neutral: "all",
        options: STATUS_FILTERS,
        onChange: (nextStatus) => setStatus(nextStatus as CrmClientStatus | "all"),
      },
    ];
    if (view !== "month") {
      next.push({
        id: "booked-dates",
        kind: "dates",
        label: "Dates",
        from,
        to,
        onFromChange: setFrom,
        onToChange: setTo,
        error: rangeError,
      });
    }
    return next;
  }, [from, rangeError, status, to, view]);
  const byDay = useMemo(() => {
    if (view !== "month") return [];
    const groups = new Map<string, CrmClient[]>();
    const sorted = [...list.items].sort(
      (left, right) => new Date(left.startsAt ?? 0).getTime() - new Date(right.startsAt ?? 0).getTime(),
    );
    for (const client of sorted) {
      const key = client.startsAt ? formatDate(client.startsAt) : "Dates not set";
      groups.set(key, [...(groups.get(key) ?? []), client]);
    }
    return [...groups.entries()];
  }, [list.items, view]);
  const loadContacts = useCallback(() => listContacts({ page: 1, limit: 100 }), []);
  const loadEnquiries = useCallback(() => listEnquiries({ page: 1, limit: 100 }), []);
  const contacts = useResource(loadContacts, canRead && canReadContacts);
  const enquiries = useResource(loadEnquiries, canRead && canReadEnquiries);
  const shown = useMemo(() => {
    const nameFor = (client: CrmClient) =>
      contacts.data?.items.find((item) => item.id === client.contactId)?.name || client.billingName;
    return [...list.items].sort((left, right) => {
      if (sort === "name") return compareText(nameFor(left), nameFor(right), order);
      if (sort === "status") return compareText(left.status, right.status, order);
      return compareTime(left.startsAt, right.startsAt, order);
    });
  }, [contacts.data, list.items, order, sort]);

  const reminderFor = (client: CrmClient): ReminderTarget => {
    const contact = contacts.data?.items.find((item) => item.id === client.contactId);
    return {
      label: personLine(contact?.name || client.billingName, contact?.mobile),
      contactId: client.contactId,
      enquiryId: client.convertedFromEnquiryId,
    };
  };

  const followFor = (client: CrmClient) => {
    if (!client.convertedFromEnquiryId) return null;
    return {
      id: client.convertedFromEnquiryId,
      title:
        enquiries.data?.items.find((enquiry) => enquiry.id === client.convertedFromEnquiryId)?.title ??
        client.billingName,
    };
  };

  if (!canRead) return <ForbiddenState label="booked clients" />;

  const renderClient = (client: CrmClient) => {
    const contact = contacts.data?.items.find((item) => item.id === client.contactId);
    return (
      <ClientRow
        key={client.id}
        client={client}
        contactName={contact?.name ?? null}
        contactMobile={contact?.mobile ?? null}
        enquiryTitle={
          enquiries.data?.items.find((enquiry) => enquiry.id === client.convertedFromEnquiryId)?.title ?? null
        }
        onOpen={() => setSelected(client)}
        onPay={canCreatePayment ? () => setPaying(client) : undefined}
        onRemind={canCreateReminder ? () => setReminding(reminderFor(client)) : undefined}
        onFollow={
          canCreateFollowUp && client.convertedFromEnquiryId
            ? () => {
                const follow = followFor(client);
                if (follow) setFollowing(follow);
              }
            : undefined
        }
      />
    );
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-2">
        <ViewSwitch options={VIEW_OPTIONS} value={view} onChange={setView} label="Booked view" />
        {canCreate ? <AddButton label="New" onClick={() => setCreateOpen(true)} /> : null}
      </div>
      <FilterSortBar
        query={query}
        onQuery={setQuery}
        searchPlaceholder="Search bookings"
        searchLabel="Search bookings"
        sort={sort}
        onSort={(next) => setSort(next as BookedSort)}
        sortOptions={BOOKED_SORTS}
        defaultSort="date"
        order={order}
        onOrder={setOrder}
        defaultOrder="asc"
        sections={filterSections}
        resultCount={shown.length}
        singular="booking"
        plural="bookings"
        onClear={() => {
          setStatus("all");
          setFrom("");
          setTo("");
        }}
      />
      {view === "month" ? <MonthNav cursor={cursor} onChange={setCursor} /> : null}

      {list.status === "loading" ? <LoadingState label="Loading bookings…" /> : null}
      {list.status === "error" ? <ErrorState message={list.errorMessage} onRetry={list.reload} /> : null}
      {list.status === "forbidden" ? <ForbiddenState label="booked clients" /> : null}
      {list.status === "ready" && list.items.length === 0 ? <EmptyState label="No bookings found." /> : null}

      {list.status === "ready" && list.items.length > 0 && (view === "list" || view === "cards") ? (
        <div className="space-y-2">
          {shown.map(renderClient)}
          <LoadMore hasMore={list.hasMore} loading={list.loadingMore} onLoadMore={list.loadMore} />
        </div>
      ) : null}

      {list.status === "ready" && list.items.length > 0 && view === "month" ? (
        <div className="space-y-4">
          {byDay.map(([day, clients]) => (
            <section key={day} aria-label={day} className="space-y-2">
              <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{day}</h3>
              {clients.map(renderClient)}
            </section>
          ))}
          <LoadMore hasMore={list.hasMore} loading={list.loadingMore} onLoadMore={list.loadMore} />
        </div>
      ) : null}

      <ClientDetailSheet
        client={selected}
        permissions={permissions}
        onClose={() => setSelected(null)}
        onRemoved={list.reload}
        onEdit={(client) => {
          setSelected(null);
          setEditing(client);
        }}
        onRemind={
          canCreateReminder
            ? (client) => {
                setSelected(null);
                setReminding(reminderFor(client));
              }
            : undefined
        }
        onFollow={
          canCreateFollowUp
            ? (client) => {
                const follow = followFor(client);
                if (!follow) return;
                setSelected(null);
                setFollowing(follow);
              }
            : undefined
        }
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
        client={
          paying
            ? {
                id: paying.id,
                enquiryId: paying.convertedFromEnquiryId,
                label: personLine(
                  contacts.data?.items.find((item) => item.id === paying.contactId)?.name || paying.billingName,
                  contacts.data?.items.find((item) => item.id === paying.contactId)?.mobile,
                ),
              }
            : null
        }
        onOpenChange={(next) => {
          if (!next) setPaying(null);
        }}
        onCreated={list.reload}
      />
      <CreateClientSheet open={createOpen} onOpenChange={setCreateOpen} onCreated={list.reload} />
      <EditClientSheet
        client={editing}
        onOpenChange={(next) => {
          if (!next) setEditing(null);
        }}
        onSaved={list.reload}
      />
    </div>
  );
}
