import { useCallback, useMemo, useState, type ReactNode } from "react";
import { useSearchParams } from "react-router-dom";
import { toast } from "sonner";
import { EmptyState, ErrorState, ForbiddenState, LoadingState } from "@/components/PageState";
import type { ChipOption } from "@/components/FilterChips";
import { ViewSwitch } from "@/components/ViewSwitch";
import { FilterSortBar, type FilterSection } from "@/components/FilterSortSheet";
import { ConvertEnquirySheet } from "@/components/forms/ConvertEnquirySheet";
import { CreateEnquirySheet } from "@/components/forms/CreateEnquirySheet";
import { CreateFollowUpSheet } from "@/components/forms/CreateFollowUpSheet";
import { NativeSelect } from "@/components/forms/NativeSelect";
import { QuickReminderSheet, type ReminderTarget } from "@/components/forms/QuickReminderSheet";
import { EnquiryDetailSheet } from "@/components/records/EnquiryDetailSheet";
import { StageMoveConfirm } from "@/components/records/StageMoveConfirm";
import { RecordShortcuts } from "@/components/records/RecordShortcuts";
import { ListRow } from "@/components/ListRow";
import { LoadMore } from "@/components/LoadMore";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { dayKey } from "@/lib/mobile/calendar";
import { formatDate, humanize, matchesQuery, personLine } from "@/lib/mobile/format";
import { compareNumber, compareText, compareTime, type SortOrder } from "@/lib/mobile/sort";
import { convertEnquiry, listContacts, listCrmUsers, listEnquiries, updateEnquiry } from "@/lib/mobile/remote";
import { useMobile } from "@/lib/mobile/store";
import { useCreateIntent } from "@/lib/mobile/use-create-intent";
import { usePagedList } from "@/lib/mobile/use-paged-list";
import { useResource } from "@/lib/mobile/use-resource";
import {
  CRM_ENQUIRY_STATUSES,
  CRM_PERMISSIONS,
  type ConvertEnquiryInput,
  type CrmEnquiry,
  type CrmEnquiryStatus,
} from "@/types/crm";

type EnquiryFilter = CrmEnquiryStatus | "all" | "open";
type EnquiryView = "list" | "cards" | "board";
type EnquirySort = "newest" | "due" | "title" | "value";

const ENQUIRY_SORTS: { value: EnquirySort; label: string }[] = [
  { value: "newest", label: "Newest" },
  { value: "due", label: "Due date" },
  { value: "title", label: "Title" },
  { value: "value", label: "Expected value" },
];

const VIEW_OPTIONS: ChipOption<EnquiryView>[] = [
  { value: "list", label: "List" },
  { value: "cards", label: "Cards" },
  { value: "board", label: "Board" },
];

const STATUS_FILTERS: ChipOption<EnquiryFilter>[] = [
  { value: "all", label: "All" },
  { value: "open", label: "Open" },
  ...CRM_ENQUIRY_STATUSES.map((status) => ({ value: status, label: humanize(status) })),
];

function readEnquiryFilter(value: string | null): EnquiryFilter {
  if (value === "open") return "open";
  if (value && (CRM_ENQUIRY_STATUSES as readonly string[]).includes(value)) {
    return value as CrmEnquiryStatus;
  }
  return "all";
}

function EnquiryRow({
  enquiry,
  person,
  onOpen,
  onRemind,
  onFollow,
  stageControl,
}: {
  enquiry: CrmEnquiry;
  person: string | null;
  onOpen: () => void;
  onRemind?: () => void;
  onFollow?: () => void;
  stageControl?: ReactNode;
}) {
  const detail = [person, enquiry.source || "No source"].filter(Boolean).join(" · ");
  const shortcuts = onRemind || onFollow ? <RecordShortcuts onRemind={onRemind} onFollow={onFollow} /> : null;
  return (
    <ListRow
      title={enquiry.title}
      detail={detail}
      value={formatDate(enquiry.dueDate)}
      badge={
        <Badge
          variant={enquiry.status === "closed" ? "secondary" : "default"}
          className="rounded-lg text-[10px]"
        >
          {humanize(enquiry.status)}
        </Badge>
      }
      onClick={onOpen}
      footer={
        stageControl || shortcuts ? (
          <div className="space-y-2">
            {stageControl}
            {shortcuts}
          </div>
        ) : undefined
      }
    />
  );
}

export default function Enquiries() {
  const { permissions } = useMobile();
  const canRead = permissions.includes(CRM_PERMISSIONS.enquiriesRead);
  const canCreate = permissions.includes(CRM_PERMISSIONS.enquiriesCreate);
  const canUpdate = permissions.includes(CRM_PERMISSIONS.enquiriesUpdate);
  const canConvert = permissions.includes(CRM_PERMISSIONS.enquiriesConvert);
  const canReadContacts = permissions.includes(CRM_PERMISSIONS.contactsRead);
  const canReadUsers = permissions.includes(CRM_PERMISSIONS.usersRead);
  const canCreateReminder = permissions.includes(CRM_PERMISSIONS.calendarCreate);
  const canCreateFollowUp = permissions.includes(CRM_PERMISSIONS.followUpsCreate);

  const [params, setParams] = useSearchParams();
  const status = readEnquiryFilter(params.get("status"));
  const dueToday = params.get("due") === "today";
  const setStatus = (next: EnquiryFilter) => {
    setParams(
      (current) => {
        const nextParams = new URLSearchParams(current);
        if (next === "all") nextParams.delete("status");
        else nextParams.set("status", next);
        return nextParams;
      },
      { replace: true },
    );
  };
  const [view, setView] = useState<EnquiryView>("list");
  const [assignedToId, setAssignedToId] = useState("");
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState<EnquirySort>("newest");
  const [order, setOrder] = useState<SortOrder>("desc");
  const [selected, setSelected] = useState<CrmEnquiry | null>(null);
  const [editing, setEditing] = useState<CrmEnquiry | null>(null);
  const [converting, setConverting] = useState<CrmEnquiry | null>(null);
  const [following, setFollowing] = useState<CrmEnquiry | null>(null);
  const [reminding, setReminding] = useState<ReminderTarget | null>(null);
  const [pendingMove, setPendingMove] = useState<{ enquiry: CrmEnquiry; stage: CrmEnquiryStatus } | null>(null);
  const [moving, setMoving] = useState(false);
  const [createOpen, setCreateOpen] = useCreateIntent(canCreate);
  const [today] = useState(() => new Date());

  const listStatus = view === "board" ? "all" : status;
  const load = useCallback(
    (page: number) =>
      listEnquiries({
        page,
        limit: view === "board" || dueToday ? 100 : 20,
        status: listStatus === "all" ? undefined : listStatus,
        assignedToId: assignedToId || undefined,
      }),
    [listStatus, assignedToId, view, dueToday],
  );

  const signature = useMemo(
    () => `${view}|${listStatus}|${assignedToId}|${dueToday ? "due" : ""}`,
    [view, listStatus, assignedToId, dueToday],
  );
  const list = usePagedList(load, signature, canRead);
  const loadContacts = useCallback(() => listContacts({ page: 1, limit: 100 }), []);
  const contacts = useResource(loadContacts, canRead && canReadContacts);
  const loadUsers = useCallback(() => listCrmUsers({ page: 1, limit: 50 }), []);
  const users = useResource(loadUsers, canRead && canReadUsers);
  const personFor = useCallback(
    (enquiry: CrmEnquiry) => {
      const contact = contacts.data?.items.find((item) => item.id === enquiry.contactId);
      return contact ? personLine(contact.name, contact.mobile) : null;
    },
    [contacts.data],
  );
  const visible = useMemo(() => {
    const filtered = list.items.filter((enquiry) => {
      if (dueToday && (!enquiry.dueDate || dayKey(new Date(enquiry.dueDate)) !== dayKey(new Date()))) return false;
      return matchesQuery(query, enquiry.title, enquiry.source, enquiry.notes, enquiry.status, personFor(enquiry));
    });
    return [...filtered].sort((left, right) => {
      if (sort === "title") return compareText(left.title, right.title, order);
      if (sort === "due") return compareTime(left.dueDate, right.dueDate, order);
      if (sort === "value") return compareNumber(left.expectedValue, right.expectedValue, order);
      return compareTime(left.createdAt, right.createdAt, order);
    });
  }, [dueToday, list.items, order, personFor, query, sort]);
  const assigneeOptions = useMemo(
    () =>
      (users.data?.items ?? []).map((user) => ({
        value: user.id,
        label: `${user.firstName} ${user.lastName}`.trim() || user.email,
      })),
    [users.data],
  );
  const filterSections: FilterSection[] = [];
  if (view !== "board") {
    filterSections.push({
      id: "stage",
      kind: "single",
      label: "Stage",
      value: status,
      neutral: "all",
      options: STATUS_FILTERS,
      onChange: (nextStatus) => setStatus(nextStatus as EnquiryFilter),
    });
  }
  if (canReadUsers && assigneeOptions.length > 0) {
    filterSections.push({
      id: "assignee",
      kind: "single",
      label: "Assigned to",
      value: assignedToId,
      neutral: "",
      options: [{ value: "", label: "Everyone" }, ...assigneeOptions],
      onChange: setAssignedToId,
    });
  }

  const confirmMove = async (result: { closedReason?: string; booking?: ConvertEnquiryInput }) => {
    if (!pendingMove) return;
    setMoving(true);
    try {
      if (result.booking) {
        await convertEnquiry(pendingMove.enquiry.id, result.booking);
        toast.success("Converted to booked");
      } else {
        await updateEnquiry(pendingMove.enquiry.id, {
          status: pendingMove.stage,
          ...(result.closedReason ? { closedReason: result.closedReason } : {}),
        });
        toast.success(`Moved to ${humanize(pendingMove.stage)}`);
      }
      setPendingMove(null);
      list.reload();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to move enquiry");
    } finally {
      setMoving(false);
    }
  };

  if (!canRead) return <ForbiddenState label="enquiries" />;

  const renderRow = (enquiry: CrmEnquiry) => (
    <EnquiryRow
      key={enquiry.id}
      enquiry={enquiry}
      person={personFor(enquiry)}
      onOpen={() => setSelected(enquiry)}
      onRemind={
        canCreateReminder
          ? () =>
              setReminding({
                label: personFor(enquiry) || enquiry.title,
                contactId: enquiry.contactId,
                enquiryId: enquiry.id,
              })
          : undefined
      }
      onFollow={canCreateFollowUp && enquiry.status !== "closed" ? () => setFollowing(enquiry) : undefined}
      stageControl={
        (view === "board" || view === "cards") && canUpdate ? (
          <>
            <Label htmlFor={`enquiry-move-${enquiry.id}`} className="sr-only">
              Stage for {enquiry.title}
            </Label>
            <NativeSelect
              id={`enquiry-move-${enquiry.id}`}
              value={enquiry.status}
              disabled={moving}
              onChange={(next) => {
                if (next !== enquiry.status) setPendingMove({ enquiry, stage: next as CrmEnquiryStatus });
              }}
              className="h-9 text-sm"
            >
              {CRM_ENQUIRY_STATUSES.map((stage) => (
                <option key={stage} value={stage}>
                  {humanize(stage)}
                </option>
              ))}
            </NativeSelect>
          </>
        ) : undefined
      }
    />
  );

  return (
    <div className="space-y-3">
      <FilterSortBar
        views={<ViewSwitch options={VIEW_OPTIONS} value={view} onChange={setView} label="Enquiry view" />}
        query={query}
        onQuery={setQuery}
        searchPlaceholder="Search loaded enquiries"
        searchLabel="Search enquiries"
        sort={sort}
        onSort={(next) => setSort(next as EnquirySort)}
        sortOptions={ENQUIRY_SORTS}
        defaultSort="newest"
        order={order}
        onOrder={setOrder}
        defaultOrder="desc"
        sections={filterSections}
        resultCount={visible.length}
        singular="enquiry"
        plural="enquiries"
        onClear={() => {
          setStatus("all");
          setAssignedToId("");
        }}
        onAdd={canCreate ? () => setCreateOpen(true) : undefined}
        addLabel="New"
      />
      {dueToday ? (
        <p className="text-xs text-muted-foreground">Showing loaded enquiries whose due date is today.</p>
      ) : null}

      {pendingMove ? (
        <StageMoveConfirm
          key={`${pendingMove.enquiry.id}-${pendingMove.stage}`}
          enquiry={pendingMove.enquiry}
          stage={pendingMove.stage}
          canConvert={canConvert}
          busy={moving}
          onCancel={() => setPendingMove(null)}
          onConfirm={(result) => void confirmMove(result)}
        />
      ) : null}

      {list.status === "loading" ? <LoadingState label="Loading enquiries…" /> : null}
      {list.status === "error" ? <ErrorState message={list.errorMessage} onRetry={list.reload} /> : null}
      {list.status === "forbidden" ? <ForbiddenState label="enquiries" /> : null}
      {list.status === "ready" && visible.length === 0 ? <EmptyState label="No enquiries found." /> : null}

      {list.status === "ready" && visible.length > 0 && (view === "list" || view === "cards") ? (
        <div className="space-y-2">{visible.map(renderRow)}</div>
      ) : null}

      {list.status === "ready" && visible.length > 0 && view === "board" ? (
        <div className="space-y-4">
          {CRM_ENQUIRY_STATUSES.map((stage) => {
            const items = visible.filter((enquiry) => enquiry.status === stage);
            return (
              <section key={stage} aria-label={humanize(stage)} className="space-y-2">
                <h3 className="flex items-center justify-between text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  <span>{humanize(stage)}</span>
                  <span className="tabular-nums">{items.length}</span>
                </h3>
                {items.length === 0 ? (
                  <p className="rounded-2xl border border-dashed border-border px-4 py-3 text-xs text-muted-foreground">Empty</p>
                ) : (
                  <div className="space-y-2">{items.map(renderRow)}</div>
                )}
              </section>
            );
          })}
        </div>
      ) : null}

      {list.status === "ready" ? (
        <LoadMore hasMore={list.hasMore} loading={list.loadingMore} onLoadMore={list.loadMore} />
      ) : null}

      <EnquiryDetailSheet
        enquiry={selected}
        permissions={permissions}
        onClose={() => setSelected(null)}
        onChanged={list.reload}
        onEdit={(enquiry) => {
          setSelected(null);
          setEditing(enquiry);
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
                  label: personFor(enquiry) || enquiry.title,
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
      <CreateEnquirySheet open={createOpen} onOpenChange={setCreateOpen} onCreated={list.reload} />
      <CreateEnquirySheet
        open={Boolean(editing)}
        enquiry={editing}
        onOpenChange={(next) => {
          if (!next) setEditing(null);
        }}
        onCreated={list.reload}
      />
      <QuickReminderSheet
        target={reminding}
        onOpenChange={(next) => {
          if (!next) setReminding(null);
        }}
        onCreated={list.reload}
      />
      <CreateFollowUpSheet
        open={Boolean(following)}
        enquiry={following}
        day={today}
        onOpenChange={(next) => {
          if (!next) setFollowing(null);
        }}
        onCreated={list.reload}
      />
      <ConvertEnquirySheet
        enquiry={converting}
        onOpenChange={(next) => {
          if (!next) setConverting(null);
        }}
        onConverted={list.reload}
      />
    </div>
  );
}
