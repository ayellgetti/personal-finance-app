import { useCallback, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { toast } from "sonner";
import { EmptyState, ErrorState, ForbiddenState, LoadingState } from "@/components/PageState";
import type { ChipOption } from "@/components/FilterChips";
import { ViewSwitch } from "@/components/ViewSwitch";
import { FilterSortBar } from "@/components/FilterSortSheet";
import { ConvertEnquirySheet } from "@/components/forms/ConvertEnquirySheet";
import { CreateEnquirySheet } from "@/components/forms/CreateEnquirySheet";
import { CreateFollowUpSheet } from "@/components/forms/CreateFollowUpSheet";
import { QuickReminderSheet, type ReminderTarget } from "@/components/forms/QuickReminderSheet";
import { EnquiryDetailSheet } from "@/components/records/EnquiryDetailSheet";
import { ListRow } from "@/components/ListRow";
import { LoadMore } from "@/components/LoadMore";
import { MonthNav } from "@/components/MonthNav";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { monthBounds } from "@/lib/mobile/calendar";
import { formatDate, formatTime, humanize, matchesQuery, personLine } from "@/lib/mobile/format";
import { compareText, compareTime, type SortOrder } from "@/lib/mobile/sort";
import { filterFollowUpCalendar, followUpCalendarRange, readFollowUpWhen, type FollowUpWhen } from "@/lib/mobile/follow-ups";
import {
  fetchEnquiry,
  listContacts,
  listEnquiries,
  listFollowUpCalendar,
  listFollowUps,
  removeFollowUp,
} from "@/lib/mobile/remote";
import { useMobile } from "@/lib/mobile/store";
import { useCreateIntent } from "@/lib/mobile/use-create-intent";
import { usePagedList } from "@/lib/mobile/use-paged-list";
import { useResource } from "@/lib/mobile/use-resource";
import { buildLeadTimeline } from "@/lib/mobile/lead-timeline";
import { CRM_PERMISSIONS, type CrmEnquiry, type CrmFollowUp, type CrmFollowUpCalendarItem } from "@/types/crm";

type FollowUpView = "list" | "cards" | "month" | "timeline";
type FollowUpSort = "due" | "title";

const FOLLOW_UP_SORTS: { value: FollowUpSort; label: string }[] = [
  { value: "due", label: "Due date" },
  { value: "title", label: "Title" },
];

const VIEW_OPTIONS: ChipOption<FollowUpView>[] = [
  { value: "list", label: "List" },
  { value: "cards", label: "Cards" },
  { value: "month", label: "Month" },
  { value: "timeline", label: "Timeline" },
];

const WHEN_FILTERS: ChipOption<FollowUpWhen>[] = [
  { value: "today", label: "Today" },
  { value: "overdue", label: "Overdue" },
  { value: "upcoming", label: "Upcoming" },
  { value: "history", label: "History" },
];

export default function FollowUps() {
  const { permissions } = useMobile();
  const canRead = permissions.includes(CRM_PERMISSIONS.followUpsRead);
  const canCreate = permissions.includes(CRM_PERMISSIONS.followUpsCreate);
  const canUpdate = permissions.includes(CRM_PERMISSIONS.followUpsUpdate);
  const canDelete = permissions.includes(CRM_PERMISSIONS.followUpsDelete);
  const canReadEnquiries = permissions.includes(CRM_PERMISSIONS.enquiriesRead);
  const canReadContacts = permissions.includes(CRM_PERMISSIONS.contactsRead);
  const canCreateReminder = permissions.includes(CRM_PERMISSIONS.calendarCreate);

  const [params, setParams] = useSearchParams();
  const when = readFollowUpWhen(params.get("when"));
  const setWhen = (next: FollowUpWhen) => {
    setParams(
      (current) => {
        const nextParams = new URLSearchParams(current);
        if (next === "today") nextParams.delete("when");
        else nextParams.set("when", next);
        return nextParams;
      },
      { replace: true },
    );
  };

  const [view, setView] = useState<FollowUpView>("list");
  const [cursor, setCursor] = useState(() => new Date());
  const [today] = useState(() => new Date());
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState<FollowUpSort>("due");
  const [order, setOrder] = useState<SortOrder>("asc");
  const [selected, setSelected] = useState<CrmEnquiry | null>(null);
  const [editingEnquiry, setEditingEnquiry] = useState<CrmEnquiry | null>(null);
  const [editingFollowUp, setEditingFollowUp] = useState<CrmFollowUp | null>(null);
  const [following, setFollowing] = useState<CrmEnquiry | null>(null);
  const [converting, setConverting] = useState<CrmEnquiry | null>(null);
  const [reminding, setReminding] = useState<ReminderTarget | null>(null);
  const [pendingRemove, setPendingRemove] = useState<CrmFollowUp | null>(null);
  const [removing, setRemoving] = useState(false);
  const [createOpen, setCreateOpen] = useCreateIntent(canCreate);
  const editingDay = useMemo(
    () => (editingFollowUp ? new Date(editingFollowUp.dueAt) : today),
    [editingFollowUp, today],
  );

  const dueView = view === "list" || view === "cards";
  const loadCalendar = useCallback(() => listFollowUpCalendar(followUpCalendarRange()), []);
  const calendar = useResource(loadCalendar, canRead && dueView && when !== "history");
  const loadHistory = useCallback((page: number) => listFollowUps({ page, limit: 20 }), []);
  const history = usePagedList(loadHistory, "history", canRead && (view === "timeline" || (dueView && when === "history")));
  const monthRange = useMemo(() => monthBounds(cursor), [cursor]);
  const loadMonth = useCallback(() => listFollowUpCalendar(monthRange), [monthRange]);
  const month = useResource(loadMonth, canRead && view === "month", `${monthRange.from}|${monthRange.to}`);
  const loadEnquiries = useCallback(() => listEnquiries({ page: 1, limit: 100 }), []);
  const enquiries = useResource(loadEnquiries, canRead && canReadEnquiries);
  const loadContacts = useCallback(() => listContacts({ page: 1, limit: 100 }), []);
  const contacts = useResource(loadContacts, canRead && canReadContacts);

  const refresh = () => {
    calendar.reload();
    history.reload();
    month.reload();
    enquiries.reload();
  };

  const personFor = useCallback(
    (contactId: string | null) => {
      if (!contactId) return null;
      const contact = contacts.data?.items.find((item) => item.id === contactId);
      return contact ? personLine(contact.name, contact.mobile) : null;
    },
    [contacts.data],
  );

  const enquiryFor = useCallback(
    (enquiryId: string) => enquiries.data?.items.find((item) => item.id === enquiryId) ?? null,
    [enquiries.data],
  );

  const dueItems = useMemo(() => {
    if (when === "history" || !calendar.data) return [];
    const filtered = filterFollowUpCalendar(calendar.data, when).filter((item) =>
      matchesQuery(query, item.title, humanize(item.status), humanize(item.kind), personFor(item.contactId)),
    );
    return [...filtered].sort((left, right) =>
      sort === "title" ? compareText(left.title, right.title, order) : compareTime(left.at, right.at, order),
    );
  }, [calendar.data, order, personFor, query, sort, when]);

  const monthDays = useMemo(() => {
    if (view !== "month" || !month.data) return [];
    const groups = new Map<string, CrmFollowUpCalendarItem[]>();
    const items = month.data.items
      .filter((item) =>
        matchesQuery(query, item.title, humanize(item.status), humanize(item.kind), personFor(item.contactId)),
      )
      .sort((left, right) =>
        sort === "title" ? compareText(left.title, right.title, order) : compareTime(left.at, right.at, order),
      );
    for (const item of items) {
      const key = formatDate(item.at);
      groups.set(key, [...(groups.get(key) ?? []), item]);
    }
    return [...groups.entries()];
  }, [month.data, order, personFor, query, sort, view]);

  const historyItems = useMemo(() => {
    const filtered = history.items.filter((item) => {
      const enquiry = enquiryFor(item.enquiryId);
      return matchesQuery(query, enquiry?.title, item.notes, humanize(item.stage), personFor(item.contactId));
    });
    return [...filtered].sort((left, right) => {
      const leftTitle = enquiryFor(left.enquiryId)?.title ?? "";
      const rightTitle = enquiryFor(right.enquiryId)?.title ?? "";
      return sort === "title"
        ? compareText(leftTitle, rightTitle, order)
        : compareTime(left.dueAt, right.dueAt, order);
    });
  }, [enquiryFor, history.items, order, personFor, query, sort]);

  const timelineGroups = useMemo(() => {
    const byEnquiry = new Map<string, CrmFollowUp[]>();
    for (const item of historyItems) {
      byEnquiry.set(item.enquiryId, [...(byEnquiry.get(item.enquiryId) ?? []), item]);
    }
    return [...byEnquiry.entries()].map(([enquiryId, followUps]) => ({
      enquiryId,
      enquiry: enquiryFor(enquiryId),
      followUps,
    }));
  }, [enquiryFor, historyItems]);

  const editDue = async (item: CrmFollowUpCalendarItem) => {
    try {
      const page = await listFollowUps({ enquiryId: item.enquiryId, limit: 50 });
      const match = page.items.find((followUp) => followUp.dueAt === item.at) ?? page.items[0];
      if (!match) {
        toast.error("Open the lead to log this follow-up");
        return;
      }
      setEditingFollowUp(match);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to open the follow-up");
    }
  };

  const openLead = async (enquiryId: string) => {
    if (!canReadEnquiries) return;
    try {
      setSelected(await fetchEnquiry(enquiryId));
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to open the lead");
    }
  };

  const remove = async () => {
    if (!pendingRemove) return;
    setRemoving(true);
    try {
      await removeFollowUp(pendingRemove.id);
      toast.success("Follow-up removed");
      setPendingRemove(null);
      refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to remove follow-up");
    } finally {
      setRemoving(false);
    }
  };

  if (!canRead) return <ForbiddenState label="follow-ups" />;

  const active = view === "month" ? month : view === "timeline" || when === "history" ? history : calendar;
  const loading = active.status === "loading";
  const failed = active.status === "error";
  const forbidden = active.status === "forbidden";
  const errorMessage = active.errorMessage;
  const retry = active.reload;
  const listView = dueView;

  return (
    <div className="space-y-3">
      <FilterSortBar
        views={<ViewSwitch options={VIEW_OPTIONS} value={view} onChange={setView} label="Follow-up view" />}
        query={query}
        onQuery={setQuery}
        searchPlaceholder="Search follow-ups"
        searchLabel="Search follow-ups"
        sort={sort}
        onSort={(next) => setSort(next as FollowUpSort)}
        sortOptions={FOLLOW_UP_SORTS}
        defaultSort="due"
        order={order}
        onOrder={setOrder}
        defaultOrder="asc"
        sections={
          listView
            ? [
                {
                  id: "when",
                  kind: "single",
                  label: "When",
                  value: when,
                  neutral: "today",
                  options: WHEN_FILTERS,
                  onChange: (next) => setWhen(next as FollowUpWhen),
                },
              ]
            : []
        }
        resultCount={
          view === "month"
            ? monthDays.reduce((sum, [, items]) => sum + items.length, 0)
            : view === "timeline" || when === "history"
              ? historyItems.length
              : dueItems.length
        }
        singular="follow-up"
        plural="follow-ups"
        onClear={() => setWhen("today")}
        onAdd={canCreate ? () => setCreateOpen(true) : undefined}
        addLabel="New"
      />
      {view === "month" ? <MonthNav cursor={cursor} onChange={setCursor} /> : null}

      {pendingRemove ? (
        <div className="space-y-3 rounded-2xl border border-border p-3">
          <p className="text-sm">Remove this follow-up from the lead conversation?</p>
          <div className="flex gap-2">
            <Button type="button" variant="outline" className="rounded-xl" disabled={removing} onClick={() => setPendingRemove(null)}>
              Cancel
            </Button>
            <Button type="button" variant="destructive" className="rounded-xl" disabled={removing} onClick={() => void remove()}>
              Remove
            </Button>
          </div>
        </div>
      ) : null}

      {loading ? <LoadingState label="Loading follow-ups…" /> : null}
      {failed ? <ErrorState message={errorMessage} onRetry={retry} /> : null}
      {forbidden ? <ForbiddenState label="follow-ups" /> : null}

      {!listView && month.status === "ready" && monthDays.length === 0 ? (
        <EmptyState label="No follow-ups this month." />
      ) : null}
      {!listView && month.status === "ready"
        ? monthDays.map(([day, items]) => (
            <section key={day} aria-label={day} className="space-y-2">
              <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{day}</h3>
              {items.map((item) => (
                <DueRow
                  key={`${item.kind}-${item.enquiryId}-${item.at}`}
                  item={item}
                  person={personFor(item.contactId)}
                  value={formatTime(item.at)}
                  onOpen={canReadEnquiries ? () => void openLead(item.enquiryId) : undefined}
                  onEdit={canUpdate && item.kind === "followup" ? () => void editDue(item) : undefined}
                />
              ))}
            </section>
          ))
        : null}

      {listView && when !== "history" && calendar.status === "ready" && dueItems.length === 0 ? (
        <EmptyState label="No follow-ups in this view." />
      ) : null}
      {listView && when === "history" && history.status === "ready" && historyItems.length === 0 ? (
        <EmptyState label="No follow-up history yet." />
      ) : null}

      {listView && when !== "history" && calendar.status === "ready" ? (
        <div className="space-y-2">
          {dueItems.map((item) => (
            <DueRow
              key={`${item.kind}-${item.enquiryId}-${item.at}`}
              item={item}
              person={personFor(item.contactId)}
              onOpen={canReadEnquiries ? () => void openLead(item.enquiryId) : undefined}
              onEdit={canUpdate && item.kind === "followup" ? () => void editDue(item) : undefined}
            />
          ))}
        </div>
      ) : null}

      {listView && when === "history" && history.status === "ready" ? (
        <div className="space-y-2">
          {historyItems.map((item) => (
            <HistoryRow
              key={item.id}
              followUp={item}
              title={enquiryFor(item.enquiryId)?.title ?? "Follow-up"}
              person={personFor(item.contactId)}
              onOpen={canReadEnquiries ? () => void openLead(item.enquiryId) : undefined}
              onEdit={canUpdate ? () => setEditingFollowUp(item) : undefined}
              onRemove={canDelete ? () => setPendingRemove(item) : undefined}
            />
          ))}
          <LoadMore hasMore={history.hasMore} loading={history.loadingMore} onLoadMore={history.loadMore} />
        </div>
      ) : null}

      {view === "timeline" && history.status === "ready" && timelineGroups.length === 0 ? (
        <EmptyState label="No follow-up history yet." />
      ) : null}
      {view === "timeline" && history.status === "ready"
        ? timelineGroups.map((group) => {
            const title = group.enquiry?.title ?? "Follow-up";
            const timeline = group.enquiry ? buildLeadTimeline(group.enquiry, group.followUps) : [];
            return (
              <section key={group.enquiryId} aria-label={title} className="space-y-2 rounded-2xl border border-border bg-card p-4">
                <button
                  type="button"
                  className="text-left text-base font-semibold"
                  onClick={canReadEnquiries ? () => void openLead(group.enquiryId) : undefined}
                >
                  {title}
                </button>
                {timeline.length > 0 ? (
                  <ol className="space-y-2">
                    {timeline.map((event) => (
                      <li key={event.id} className="border-l-2 border-border pl-3">
                        <p className="text-sm font-medium">{event.title}</p>
                        <p className="text-xs text-muted-foreground">{formatDate(event.at)}</p>
                        {event.notes ? <p className="whitespace-pre-wrap text-sm text-muted-foreground">{event.notes}</p> : null}
                      </li>
                    ))}
                  </ol>
                ) : (
                  group.followUps.map((followUp) => (
                    <p key={followUp.id} className="text-sm text-muted-foreground">
                      {followUp.notes?.trim() || humanize(followUp.stage)}
                    </p>
                  ))
                )}
              </section>
            );
          })
        : null}

      <EnquiryDetailSheet
        enquiry={selected}
        permissions={permissions}
        onClose={() => setSelected(null)}
        onChanged={refresh}
        onEdit={(enquiry) => {
          setSelected(null);
          setEditingEnquiry(enquiry);
        }}
        onFollow={(enquiry) => {
          setSelected(null);
          setFollowing(enquiry);
        }}
        onRemind={
          canCreateReminder
            ? (enquiry) => {
                setSelected(null);
                setReminding({
                  label: personFor(enquiry.contactId) || enquiry.title,
                  contactId: enquiry.contactId,
                  enquiryId: enquiry.id,
                });
              }
            : undefined
        }
        onConvert={(enquiry) => {
          setSelected(null);
          setConverting(enquiry);
        }}
      />
      <CreateFollowUpSheet
        open={createOpen}
        day={today}
        onOpenChange={setCreateOpen}
        onCreated={refresh}
      />
      <CreateFollowUpSheet
        open={Boolean(editingFollowUp)}
        followUp={editingFollowUp}
        enquiry={
          editingFollowUp
            ? { id: editingFollowUp.enquiryId, title: enquiryFor(editingFollowUp.enquiryId)?.title ?? "Enquiry" }
            : null
        }
        day={editingDay}
        onOpenChange={(next) => {
          if (!next) setEditingFollowUp(null);
        }}
        onCreated={refresh}
      />
      <CreateFollowUpSheet
        open={Boolean(following)}
        enquiry={following}
        day={today}
        onOpenChange={(next) => {
          if (!next) setFollowing(null);
        }}
        onCreated={refresh}
      />
      <CreateEnquirySheet
        open={Boolean(editingEnquiry)}
        enquiry={editingEnquiry}
        onOpenChange={(next) => {
          if (!next) setEditingEnquiry(null);
        }}
        onCreated={refresh}
      />
      <ConvertEnquirySheet
        enquiry={converting}
        onOpenChange={(next) => {
          if (!next) setConverting(null);
        }}
        onConverted={refresh}
      />
      <QuickReminderSheet
        target={reminding}
        onOpenChange={(next) => {
          if (!next) setReminding(null);
        }}
        onCreated={refresh}
      />
    </div>
  );
}

function DueRow({
  item,
  person,
  value,
  onOpen,
  onEdit,
}: {
  item: CrmFollowUpCalendarItem;
  person: string | null;
  value?: string;
  onOpen?: () => void;
  onEdit?: () => void;
}) {
  return (
    <ListRow
      title={item.title}
      detail={[person, humanize(item.kind)].filter(Boolean).join(" · ")}
      value={value ?? formatDate(item.at)}
      accentClassName={item.overdue ? "border-l-destructive" : "border-l-amber-500"}
      badge={
        <Badge variant={item.overdue ? "destructive" : "secondary"} className="rounded-lg text-[10px]">
          {item.overdue ? "Overdue" : humanize(item.status)}
        </Badge>
      }
      onClick={onOpen}
      footer={
        onEdit ? (
          <div className="border-t border-border px-4 py-2">
            <Button type="button" size="sm" variant="outline" className="rounded-xl" onClick={onEdit}>
              Edit
            </Button>
          </div>
        ) : undefined
      }
    />
  );
}

function HistoryRow({
  followUp,
  title,
  person,
  onOpen,
  onEdit,
  onRemove,
}: {
  followUp: CrmFollowUp;
  title: string;
  person: string | null;
  onOpen?: () => void;
  onEdit?: () => void;
  onRemove?: () => void;
}) {
  return (
    <ListRow
      title={title}
      detail={[person, followUp.notes?.trim() || "No notes"].filter(Boolean).join(" · ")}
      value={formatDate(followUp.nextFollowupDate)}
      badge={
        <Badge variant="secondary" className="rounded-lg text-[10px]">
          {humanize(followUp.stage)}
        </Badge>
      }
      onClick={onOpen}
      footer={
        onEdit || onRemove ? (
          <div className="flex gap-2 border-t border-border px-4 py-2">
            {onEdit ? (
              <Button type="button" size="sm" variant="outline" className="rounded-xl" onClick={onEdit}>
                Edit
              </Button>
            ) : null}
            {onRemove ? (
              <Button type="button" size="sm" variant="outline" className="rounded-xl text-destructive" onClick={onRemove}>
                Remove
              </Button>
            ) : null}
          </div>
        ) : undefined
      }
    />
  );
}
