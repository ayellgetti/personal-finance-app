import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { ConfirmInline } from "@/components/ConfirmInline";
import { EmptyState, ErrorState, ForbiddenState, LoadingState } from "@/components/PageState";
import type { ChipOption } from "@/components/FilterChips";
import { ViewSwitch } from "@/components/ViewSwitch";
import { FilterSortBar } from "@/components/FilterSortSheet";
import { ReminderSheet, type EditableReminder } from "@/components/forms/ReminderSheet";
import { ListRow } from "@/components/ListRow";
import { LoadMore } from "@/components/LoadMore";
import { MonthNav } from "@/components/MonthNav";
import { Button } from "@/components/ui/button";
import { monthBounds } from "@/lib/mobile/calendar";
import { formatDate, formatDateTime, formatTime, matchesQuery } from "@/lib/mobile/format";
import { compareText, compareTime, type SortOrder } from "@/lib/mobile/sort";
import { listCalendar, listContacts, removeCalendarEvent } from "@/lib/mobile/remote";
import { loadReminderBatch } from "@/lib/mobile/reminders";
import { useMobile } from "@/lib/mobile/store";
import { useCreateIntent } from "@/lib/mobile/use-create-intent";
import { useResource, type ResourceStatus } from "@/lib/mobile/use-resource";
import { CRM_PERMISSIONS, type CrmCalendarEvent } from "@/types/crm";

type ReminderView = "list" | "cards" | "month";
type ReminderSort = "date" | "title";

const REMINDER_SORTS: { value: ReminderSort; label: string }[] = [
  { value: "date", label: "Date" },
  { value: "title", label: "Title" },
];

const VIEW_OPTIONS: ChipOption<ReminderView>[] = [
  { value: "list", label: "List" },
  { value: "cards", label: "Cards" },
  { value: "month", label: "Month" },
];

export default function Reminders() {
  const { permissions } = useMobile();
  const canRead = permissions.includes(CRM_PERMISSIONS.calendarRead);
  const canCreate = permissions.includes(CRM_PERMISSIONS.calendarCreate);
  const canUpdate = permissions.includes(CRM_PERMISSIONS.calendarUpdate);
  const canDelete = permissions.includes(CRM_PERMISSIONS.calendarDelete);
  const canReadContacts = permissions.includes(CRM_PERMISSIONS.contactsRead);

  const [view, setView] = useState<ReminderView>("list");
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState<ReminderSort>("date");
  const [order, setOrder] = useState<SortOrder>("asc");
  const [reminders, setReminders] = useState<CrmCalendarEvent[]>([]);
  const [listStatus, setListStatus] = useState<ResourceStatus>(canRead ? "loading" : "forbidden");
  const [listError, setListError] = useState<string | null>(null);
  const [nextPage, setNextPage] = useState<number | null>(null);
  const [loadingMore, setLoadingMore] = useState(false);
  const [reloadToken, setReloadToken] = useState(0);
  const [cursor, setCursor] = useState(() => new Date());
  const [editing, setEditing] = useState<EditableReminder | null>(null);
  const [pendingRemove, setPendingRemove] = useState<EditableReminder | null>(null);
  const [removing, setRemoving] = useState(false);
  const [createOpen, setCreateOpen] = useCreateIntent(canCreate);

  const listView = view === "list" || view === "cards";
  useEffect(() => {
    if (!canRead) {
      setListStatus("forbidden");
      setReminders([]);
      return;
    }
    if (!listView) return;
    let cancelled = false;
    setListStatus("loading");
    setListError(null);
    void loadReminderBatch(1)
      .then((result) => {
        if (cancelled) return;
        setReminders(result.items);
        setNextPage(result.nextPage);
        setListStatus("ready");
      })
      .catch((error: unknown) => {
        if (cancelled) return;
        setListStatus("error");
        setListError(error instanceof Error ? error.message : "Unable to load reminders");
      });
    return () => {
      cancelled = true;
    };
  }, [canRead, listView, reloadToken]);

  const loadMore = () => {
    if (nextPage == null || loadingMore) return;
    setLoadingMore(true);
    void loadReminderBatch(nextPage)
      .then((result) => {
        setReminders((current) => [...current, ...result.items]);
        setNextPage(result.nextPage);
      })
      .catch((error: unknown) => {
        setListError(error instanceof Error ? error.message : "Unable to load reminders");
      })
      .finally(() => setLoadingMore(false));
  };

  const range = useMemo(() => monthBounds(cursor), [cursor]);
  const loadMonth = useCallback(() => listCalendar(range), [range]);
  const month = useResource(loadMonth, canRead && view === "month", `${range.from}|${range.to}`);
  const loadContacts = useCallback(() => listContacts({ page: 1, limit: 100 }), []);
  const contacts = useResource(loadContacts, canRead && canReadContacts);
  const contactName = useCallback(
    (contactId: string | null) =>
      contactId ? (contacts.data?.items.find((contact) => contact.id === contactId)?.name ?? null) : null,
    [contacts.data],
  );
  const visibleReminders = useMemo(() => {
    const filtered = reminders.filter((event) =>
      matchesQuery(query, event.title, event.notes, contactName(event.contactId)),
    );
    return [...filtered].sort((left, right) =>
      sort === "title" ? compareText(left.title, right.title, order) : compareTime(left.startsAt, right.startsAt, order),
    );
  }, [contactName, order, query, reminders, sort]);
  const monthItems = useMemo(() => {
    const filtered = (month.data?.items ?? [])
      .filter((item) => item.kind === "event" && item.enquiryId == null)
      .filter((item) => matchesQuery(query, item.title, item.notes, contactName(item.contactId)));
    return [...filtered].sort((left, right) =>
      sort === "title" ? compareText(left.title, right.title, order) : compareTime(left.at, right.at, order),
    );
  }, [contactName, month.data, order, query, sort]);
  const byDay = useMemo(() => {
    const groups = new Map<string, typeof monthItems>();
    for (const item of monthItems) {
      const key = formatDate(item.at);
      groups.set(key, [...(groups.get(key) ?? []), item]);
    }
    return [...groups.entries()];
  }, [monthItems]);

  const refresh = () => {
    setReloadToken((token) => token + 1);
    month.reload();
  };

  const remove = async () => {
    if (!pendingRemove) return;
    setRemoving(true);
    try {
      await removeCalendarEvent(pendingRemove.id);
      toast.success("Reminder removed");
      setPendingRemove(null);
      refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to remove reminder");
    } finally {
      setRemoving(false);
    }
  };

  if (!canRead) return <ForbiddenState label="reminders" />;

  const row = (reminder: EditableReminder, value: string) => (
    <ListRow
      key={reminder.id}
      title={reminder.title}
      detail={[contactName(reminder.contactId), reminder.notes].filter(Boolean).join(" · ") || null}
      value={value}
      onClick={canUpdate ? () => setEditing(reminder) : undefined}
      footer={
        canDelete ? (
          <Button type="button" variant="ghost" className="h-9 rounded-xl text-destructive" onClick={() => setPendingRemove(reminder)}>
            Remove
          </Button>
        ) : undefined
      }
    />
  );

  return (
    <div className="space-y-3">
      <FilterSortBar
        views={<ViewSwitch options={VIEW_OPTIONS} value={view} onChange={setView} label="Reminder view" />}
        query={query}
        onQuery={setQuery}
        searchPlaceholder="Search reminders"
        searchLabel="Search reminders"
        sort={sort}
        onSort={(next) => setSort(next as ReminderSort)}
        sortOptions={REMINDER_SORTS}
        defaultSort="date"
        order={order}
        onOrder={setOrder}
        defaultOrder="asc"
        sections={[]}
        resultCount={listView ? visibleReminders.length : monthItems.length}
        singular="reminder"
        plural="reminders"
        onClear={() => undefined}
        onAdd={canCreate ? () => setCreateOpen(true) : undefined}
        addLabel="New reminder"
      />

      {pendingRemove ? (
        <ConfirmInline
          message={`Remove the reminder “${pendingRemove.title}”?`}
          busy={removing}
          onCancel={() => setPendingRemove(null)}
          onConfirm={() => void remove()}
        />
      ) : null}

      {listView ? (
        <>
          {listStatus === "loading" ? <LoadingState label="Loading reminders…" /> : null}
          {listStatus === "error" ? <ErrorState message={listError ?? "Unable to load reminders"} onRetry={refresh} /> : null}
          {listStatus === "forbidden" ? <ForbiddenState label="reminders" /> : null}
          {listStatus === "ready" && visibleReminders.length === 0 ? <EmptyState label="No reminders yet." /> : null}
          {listStatus === "ready" ? (
            <div className="space-y-2">
              {visibleReminders.map((event) =>
                row(
                  { id: event.id, title: event.title, startsAt: event.startsAt, notes: event.notes, contactId: event.contactId },
                  formatDateTime(event.startsAt),
                ),
              )}
              <LoadMore hasMore={nextPage != null} loading={loadingMore} onLoadMore={loadMore} />
            </div>
          ) : null}
        </>
      ) : (
        <>
          <MonthNav cursor={cursor} onChange={setCursor} />
          {month.status === "loading" ? <LoadingState label="Loading reminders…" /> : null}
          {month.status === "error" ? <ErrorState message={month.errorMessage} onRetry={month.reload} /> : null}
          {month.status === "ready" && byDay.length === 0 ? <EmptyState label="No reminders this month." /> : null}
          {month.status === "ready"
            ? byDay.map(([day, items]) => (
                <section key={day} className="space-y-2">
                  <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{day}</h3>
                  {items.map((item) =>
                    row(
                      { id: item.id, title: item.title, startsAt: item.at, notes: item.notes ?? null, contactId: item.contactId },
                      formatTime(item.at),
                    ),
                  )}
                </section>
              ))
            : null}
        </>
      )}

      <ReminderSheet
        open={createOpen || Boolean(editing)}
        onOpenChange={(next) => {
          if (next) return;
          setCreateOpen(false);
          setEditing(null);
        }}
        reminder={editing}
        canPickContact={canReadContacts}
        onSaved={refresh}
      />
    </div>
  );
}
