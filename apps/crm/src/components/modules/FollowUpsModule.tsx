import { FormEvent, useEffect, useMemo, useState } from "react";
import { CalendarDays, History, LayoutGrid, List } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import {
  ConfirmRemoveDialog,
  EditAction,
  Field,
  ModulePage,
  ModuleStatus,
  NativeSelect,
  RemoveAction,
  RowActions,
  SideSheet,
} from "@/components/modules/shared";
import {
  ENQUIRY_STATUS_LABELS,
  enquiryStatusOptions,
  formatDate,
  formatDateTime,
  isoToLocalInput,
  localInputToIso,
  parseLocalDateKey,
} from "@/lib/crm/display";
import { LeadTimeline } from "@/components/modules/LeadTimeline";
import { ConvertToBookedSheet } from "@/components/modules/ConvertToBookedSheet";
import { listFollowUpCalendar } from "@/lib/crm/remote";
import { cn } from "@/lib/utils";
import { useCrm } from "@/lib/crm/store";
import {
  CRM_ENQUIRY_STATUSES,
  CRM_PERMISSIONS,
  type CreateFollowUpInput,
  type CrmEnquiry,
  type CrmEnquiryStatus,
  type CrmFollowUp,
  type CrmFollowUpCalendarItem,
} from "@/types/crm";

type ViewMode = "table" | "card" | "calendar" | "timeline";

const WEEKDAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

function startOfDay(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function monthGrid(month: Date): Date[] {
  const first = new Date(month.getFullYear(), month.getMonth(), 1);
  const weekday = (first.getDay() + 6) % 7;
  const start = new Date(first);
  start.setDate(first.getDate() - weekday);
  return Array.from({ length: 42 }, (_, index) => {
    const day = new Date(start);
    day.setDate(start.getDate() + index);
    return day;
  });
}

function dayKey(date: Date): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

function isOverdue(item: CrmFollowUp, enquiry: CrmEnquiry | undefined): boolean {
  if (!item.nextFollowupDate || enquiry?.status === "closed") return false;
  return new Date(item.nextFollowupDate).getTime() < Date.now();
}

export type FollowUpDueFilter = "all" | "today" | "tomorrow" | "upcoming";
type DueFilter = FollowUpDueFilter;

function endOfDay(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate(), 23, 59, 59, 999);
}

function isSameDay(left: Date, right: Date): boolean {
  return (
    left.getFullYear() === right.getFullYear() &&
    left.getMonth() === right.getMonth() &&
    left.getDate() === right.getDate()
  );
}

function matchesDueFilter(value: string | null, filter: DueFilter, now: Date): boolean {
  if (filter === "all") return true;
  if (!value) return false;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return false;
  const tomorrow = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
  if (filter === "today") return isSameDay(date, now);
  if (filter === "tomorrow") return isSameDay(date, tomorrow);
  return date.getTime() > endOfDay(tomorrow).getTime();
}

type FormState = {
  enquiryId: string;
  stage: CrmEnquiryStatus;
  dueAt: string;
  nextFollowupDate: string;
  notes: string;
};

const EMPTY: FormState = {
  enquiryId: "",
  stage: "new",
  dueAt: "",
  nextFollowupDate: "",
  notes: "",
};

function validate(form: FormState): Record<string, string> {
  const errors: Record<string, string> = {};
  if (!form.enquiryId) errors.enquiryId = "Enquiry is required";
  if (!form.nextFollowupDate) errors.nextFollowupDate = "Next follow-up date is required";
  return errors;
}

function toInput(form: FormState): CreateFollowUpInput {
  return {
    enquiryId: form.enquiryId,
    stage: form.stage,
    dueAt: form.dueAt ? localInputToIso(form.dueAt) : new Date().toISOString(),
    nextFollowupDate: localInputToIso(form.nextFollowupDate),
    notes: form.notes.trim() || null,
  };
}

function StageBadge({ stage }: { stage: CrmEnquiryStatus }) {
  return <Badge variant="secondary">{ENQUIRY_STATUS_LABELS[stage]}</Badge>;
}

function enquirySelectLabel(
  enquiry: CrmEnquiry,
  contact: { name: string; mobile: string } | undefined,
): string {
  const parts = [contact?.name, contact?.mobile].filter((part): part is string => Boolean(part?.trim()));
  const customer = parts.join(" · ");
  const title = `${enquiry.title} — ${ENQUIRY_STATUS_LABELS[enquiry.status]}`;
  return customer ? `${customer} · ${title}` : title;
}

function FollowUpTable({
  items,
  enquiryById,
  onEdit,
  onRemove,
}: {
  items: CrmFollowUp[];
  enquiryById: (id: string) => CrmEnquiry | undefined;
  onEdit: (item: CrmFollowUp) => void;
  onRemove: (id: string) => void;
}) {
  const crm = useCrm();
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Date</TableHead>
          <TableHead>Enquiry</TableHead>
          <TableHead>Status</TableHead>
          <TableHead>Next follow-up</TableHead>
          <TableHead>Notes</TableHead>
          <TableHead className="text-right">Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {items.map((item) => {
          const enquiry = enquiryById(item.enquiryId);
          const overdue = isOverdue(item, enquiry);
          return (
            <TableRow
              key={item.id}
              className={cn(overdue && "bg-destructive/10")}
              data-overdue={overdue ? "true" : undefined}
            >
              <TableCell className="font-medium">{formatDateTime(item.dueAt)}</TableCell>
              <TableCell>{enquiry?.title ?? item.enquiryId}</TableCell>
              <TableCell><StageBadge stage={item.stage} /></TableCell>
              <TableCell>
                <div className="flex items-center gap-2">
                  {formatDateTime(item.nextFollowupDate)}
                  {overdue ? <Badge variant="destructive">Overdue</Badge> : null}
                </div>
              </TableCell>
              <TableCell>{item.notes ?? "—"}</TableCell>
              <TableCell>
                <RowActions>
                  {crm.hasPermission(CRM_PERMISSIONS.followUpsUpdate) ? (
                    <EditAction onClick={() => onEdit(item)} />
                  ) : null}
                  {crm.hasPermission(CRM_PERMISSIONS.followUpsDelete) ? (
                    <RemoveAction onClick={() => onRemove(item.id)} />
                  ) : null}
                </RowActions>
              </TableCell>
            </TableRow>
          );
        })}
      </TableBody>
    </Table>
  );
}

function FollowUpCards({
  items,
  enquiryById,
  onEdit,
  onRemove,
}: {
  items: CrmFollowUp[];
  enquiryById: (id: string) => CrmEnquiry | undefined;
  onEdit: (item: CrmFollowUp) => void;
  onRemove: (id: string) => void;
}) {
  const crm = useCrm();
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {items.map((item) => {
        const enquiry = enquiryById(item.enquiryId);
        const overdue = isOverdue(item, enquiry);
        return (
          <Card
            key={item.id}
            className={cn(
              "rounded-2xl shadow-[var(--shadow-card)]",
              overdue && "border-destructive",
            )}
          >
            <CardHeader className="pb-2">
              <div className="flex items-start justify-between gap-2">
                <CardTitle className="text-sm font-semibold">
                  {enquiry?.title ?? item.enquiryId}
                </CardTitle>
                {overdue ? <Badge variant="destructive">Overdue</Badge> : null}
              </div>
              <CardDescription>{formatDateTime(item.dueAt)}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <StageBadge stage={item.stage} />
              <p className="text-xs text-muted-foreground">
                Next follow-up {formatDateTime(item.nextFollowupDate)}
              </p>
              {item.notes ? (
                <p className="line-clamp-3 text-xs text-muted-foreground">{item.notes}</p>
              ) : null}
              <RowActions>
                {crm.hasPermission(CRM_PERMISSIONS.followUpsUpdate) ? (
                  <EditAction onClick={() => onEdit(item)} />
                ) : null}
                {crm.hasPermission(CRM_PERMISSIONS.followUpsDelete) ? (
                  <RemoveAction onClick={() => onRemove(item.id)} />
                ) : null}
              </RowActions>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}

function FollowUpCalendarView({
  items,
  overdue,
  cursor,
  selectedKey,
  onSelectDay,
}: {
  items: CrmFollowUpCalendarItem[];
  overdue: CrmFollowUpCalendarItem[];
  cursor: Date;
  selectedKey: string | null;
  onSelectDay: (day: Date) => void;
}) {
  const cells = useMemo(() => monthGrid(cursor), [cursor]);
  const todayKey = dayKey(new Date());
  const byDay = useMemo(() => {
    const grouped = new Map<string, { newEnquiries: number; followUps: number; overdue: number }>();
    for (const item of items) {
      const key = dayKey(new Date(item.at));
      const current = grouped.get(key) ?? { newEnquiries: 0, followUps: 0, overdue: 0 };
      if (item.kind === "new_enquiry") current.newEnquiries += 1;
      else current.followUps += 1;
      if (item.overdue) current.overdue += 1;
      grouped.set(key, current);
    }
    if (overdue.length) {
      const today = grouped.get(todayKey) ?? { newEnquiries: 0, followUps: 0, overdue: 0 };
      today.overdue = overdue.length;
      grouped.set(todayKey, today);
    }
    return grouped;
  }, [items, overdue, todayKey]);

  return (
    <div className="overflow-x-auto rounded-2xl border">
      <div className="grid min-w-[640px] grid-cols-7 border-b bg-muted/40 text-center text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        {WEEKDAYS.map((day) => (
          <div key={day} className="px-2 py-2">
            {day}
          </div>
        ))}
      </div>
      <div className="grid min-w-[640px] grid-cols-7">
        {cells.map((day) => {
          const key = dayKey(day);
          const counts = byDay.get(key) ?? { newEnquiries: 0, followUps: 0, overdue: 0 };
          const outside = day.getMonth() !== cursor.getMonth();
          const hasOverdue = counts.overdue > 0;
          return (
            <button
              key={day.toISOString()}
              type="button"
              className={cn(
                "min-h-[7.5rem] border-b border-r p-2 text-left align-top",
                outside && "bg-muted/30 text-muted-foreground",
                selectedKey === key && "bg-primary/5",
                hasOverdue && "bg-destructive/10",
              )}
              onClick={() => onSelectDay(day)}
            >
              <p className="mb-1 text-xs font-semibold">{day.getDate()}</p>
              {counts.newEnquiries > 0 ? (
                <p className="text-xs">New {counts.newEnquiries}</p>
              ) : null}
              {counts.followUps > 0 ? (
                <p className="text-xs">Follow-ups {counts.followUps}</p>
              ) : null}
              {hasOverdue && key === todayKey ? (
                <p className="text-xs font-medium text-destructive">Overdue {counts.overdue}</p>
              ) : null}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function FollowUpTimelines({
  enquiries,
  followUps,
  contactName,
  canCreate,
  canConvert,
  onFollow,
  onConvert,
}: {
  enquiries: CrmEnquiry[];
  followUps: CrmFollowUp[];
  contactName: (id: string) => string;
  canCreate: boolean;
  canConvert: boolean;
  onFollow: (enquiry: CrmEnquiry) => void;
  onConvert: (enquiry: CrmEnquiry) => void;
}) {
  if (enquiries.length === 0) {
    return <p className="text-sm text-muted-foreground">No leads to track</p>;
  }
  return (
    <div className="grid gap-4 lg:grid-cols-2">
      {enquiries.map((enquiry) => {
        const history = followUps.filter((item) => item.enquiryId === enquiry.id);
        const nextFollowupDate = enquiry.nextFollowupDate;
        const overdue =
          enquiry.status !== "closed" &&
          nextFollowupDate != null &&
          new Date(nextFollowupDate).getTime() < Date.now();
        return (
          <Card key={enquiry.id} className={cn("rounded-2xl shadow-[var(--shadow-card)]", overdue && "border-destructive")}>
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <CardTitle className="text-base leading-snug">{enquiry.title}</CardTitle>
                  <CardDescription>{contactName(enquiry.contactId)}</CardDescription>
                </div>
                <div className="flex flex-wrap items-center justify-end gap-1">
                  <StageBadge stage={enquiry.status} />
                  {overdue ? <Badge variant="destructive">Overdue</Badge> : null}
                  {enquiry.status === "closed" ? (
                    <Badge variant="outline">{enquiry.closedReason === "Booked" ? "Booked" : "Closed"}</Badge>
                  ) : null}
                  {canCreate && enquiry.status !== "closed" ? (
                    <Button
                      type="button"
                      size="sm"
                      className="h-7 rounded-lg px-2"
                      onClick={() => onFollow(enquiry)}
                    >
                      Add followup
                    </Button>
                  ) : null}
                  {canConvert && enquiry.status !== "closed" ? (
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      className="h-7 rounded-lg px-2"
                      onClick={() => onConvert(enquiry)}
                    >
                      Convert
                    </Button>
                  ) : null}
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <LeadTimeline enquiry={enquiry} followUps={history} />
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}

export function FollowUpsModule({
  initialDueFilter = "all",
  createOnDate,
  onCreateOpened,
}: {
  initialDueFilter?: FollowUpDueFilter;
  createOnDate?: string | null;
  onCreateOpened?: () => void;
} = {}) {
  const crm = useCrm();
  const sessionReady = crm.status === "ready";
  const allowed = crm.hasPermission(CRM_PERMISSIONS.followUpsRead);
  const [view, setView] = useState<ViewMode>("timeline");
  const [enquiryFilter, setEnquiryFilter] = useState("");
  const [stageFilter, setStageFilter] = useState("");
  const [outcomeFilter, setOutcomeFilter] = useState<"all" | "open" | "closed">("all");
  const [dueFilter, setDueFilter] = useState<DueFilter>(initialDueFilter);
  const [form, setForm] = useState<FormState>(EMPTY);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [editing, setEditing] = useState<CrmFollowUp | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [removeId, setRemoveId] = useState<string | null>(null);
  const [convertingEnquiry, setConvertingEnquiry] = useState<CrmEnquiry | null>(null);
  const [busy, setBusy] = useState(false);
  const [cursor, setCursor] = useState(() => new Date());
  const [calendarItems, setCalendarItems] = useState<CrmFollowUpCalendarItem[]>([]);
  const [calendarOverdue, setCalendarOverdue] = useState<CrmFollowUpCalendarItem[]>([]);
  const [calendarStatus, setCalendarStatus] = useState<"idle" | "loading" | "ready" | "error">("idle");
  const [calendarError, setCalendarError] = useState<string | null>(null);
  const [selectedDay, setSelectedDay] = useState<Date | null>(null);

  const cells = useMemo(() => monthGrid(cursor), [cursor]);
  const range = useMemo(() => {
    const from = startOfDay(cells[0] ?? cursor);
    const last = cells[cells.length - 1] ?? cursor;
    const to = new Date(last.getFullYear(), last.getMonth(), last.getDate(), 23, 59, 59, 999);
    return { from: from.toISOString(), to: to.toISOString() };
  }, [cells, cursor]);

  const reload = () => {
    void crm.loadFollowUps({
      enquiryId: enquiryFilter || undefined,
      stage: view === "timeline" ? undefined : stageFilter ? (stageFilter as CrmEnquiryStatus) : undefined,
      limit: view === "timeline" ? 500 : undefined,
    });
    if (crm.hasPermission(CRM_PERMISSIONS.enquiriesRead)) {
      void crm.loadEnquiries({
        limit: 200,
        status:
          view === "timeline"
            ? outcomeFilter === "closed"
              ? "closed"
              : undefined
            : undefined,
      });
    }
    if (crm.hasPermission(CRM_PERMISSIONS.contactsRead)) {
      void crm.loadContacts({ limit: 200 });
    }
  };

  useEffect(() => {
    if (sessionReady && allowed) reload();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessionReady, allowed, enquiryFilter, stageFilter, view, outcomeFilter]);

  useEffect(() => {
    if (!sessionReady || !allowed || view !== "calendar") return;
    setCalendarStatus("loading");
    setCalendarError(null);
    listFollowUpCalendar(range)
      .then((result) => {
        setCalendarItems(result.items);
        setCalendarOverdue(result.overdue);
        setCalendarStatus("ready");
      })
      .catch((error: unknown) => {
        setCalendarStatus("error");
        setCalendarError(error instanceof Error ? error.message : "Unable to load calendar");
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessionReady, allowed, view, range.from, range.to]);

  const enquiryById = (id: string) => crm.enquiries.items.find((enquiry) => enquiry.id === id);
  const contactById = (id: string) => crm.contacts.items.find((contact) => contact.id === id);
  const contactName = (id: string) => contactById(id)?.name ?? id;

  const timelineEnquiries = useMemo(() => {
    const now = new Date();
    let items = crm.enquiries.items;
    if (enquiryFilter) items = items.filter((enquiry) => enquiry.id === enquiryFilter);
    if (outcomeFilter === "open") items = items.filter((enquiry) => enquiry.status !== "closed");
    if (outcomeFilter === "closed") items = items.filter((enquiry) => enquiry.status === "closed");
    if (dueFilter !== "all") {
      items = items.filter((enquiry) => matchesDueFilter(enquiry.nextFollowupDate, dueFilter, now));
    }
    return items;
  }, [crm.enquiries.items, enquiryFilter, outcomeFilter, dueFilter]);

  const filteredFollowUps = useMemo(() => {
    if (dueFilter === "all") return crm.followUps.items;
    const now = new Date();
    return crm.followUps.items.filter((item) => matchesDueFilter(item.nextFollowupDate, dueFilter, now));
  }, [crm.followUps.items, dueFilter]);

  const openCreate = (enquiry?: CrmEnquiry, nextFollowupDay?: string) => {
    const selected = enquiry ?? crm.enquiries.items[0];
    const now = new Date();
    const nextDay = nextFollowupDay ? parseLocalDateKey(nextFollowupDay) : null;
    if (nextDay) nextDay.setHours(9, 0, 0, 0);
    setEditing(null);
    setForm({
      ...EMPTY,
      enquiryId: selected?.id ?? "",
      stage: selected?.status ?? "new",
      dueAt: isoToLocalInput(now.toISOString()),
      nextFollowupDate: nextDay ? isoToLocalInput(nextDay.toISOString()) : "",
    });
    setErrors({});
    setSheetOpen(true);
  };

  useEffect(() => {
    if (!createOnDate) return;
    openCreate(undefined, createOnDate);
    onCreateOpened?.();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [createOnDate]);

  const openEdit = (item: CrmFollowUp) => {
    setEditing(item);
    setForm({
      enquiryId: item.enquiryId,
      stage: item.stage,
      dueAt: isoToLocalInput(item.dueAt),
      nextFollowupDate: isoToLocalInput(item.nextFollowupDate),
      notes: item.notes ?? "",
    });
    setErrors({});
    setSheetOpen(true);
  };

  const handleEnquiryChange = (id: string) => {
    const enquiry = crm.enquiries.items.find((item) => item.id === id);
    setForm((current) => ({
      ...current,
      enquiryId: id,
      stage: enquiry?.status ?? current.stage,
    }));
  };

  const onSubmit = async (event: FormEvent) => {
    event.preventDefault();
    const nextErrors = validate(form);
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length) return;
    setBusy(true);
    try {
      if (editing) await crm.updateFollowUp(editing.id, toInput(form));
      else await crm.createFollowUp(toInput(form));
      setSheetOpen(false);
      if (view === "calendar") {
        const result = await listFollowUpCalendar(range);
        setCalendarItems(result.items);
        setCalendarOverdue(result.overdue);
      }
    } catch {
      // toast handled in store
    } finally {
      setBusy(false);
    }
  };

  const selectedKey = selectedDay ? dayKey(selectedDay) : null;
  const todayKey = dayKey(new Date());
  const selectedItems = useMemo(() => {
    if (!selectedDay) return [];
    const key = dayKey(selectedDay);
    const dayItems = calendarItems.filter((item) => dayKey(new Date(item.at)) === key);
    if (key === todayKey) {
      const seen = new Set(dayItems.map((item) => item.enquiryId));
      for (const item of calendarOverdue) {
        if (!seen.has(item.enquiryId)) dayItems.push(item);
      }
    }
    return dayItems;
  }, [calendarItems, calendarOverdue, selectedDay, todayKey]);

  const monthLabel = cursor.toLocaleDateString(undefined, { month: "long", year: "numeric" });
  const listEmpty =
    view === "calendar"
      ? calendarItems.length === 0 && calendarOverdue.length === 0
      : view === "timeline"
        ? timelineEnquiries.length === 0
        : filteredFollowUps.length === 0;

  return (
    <ModulePage crumb="Follow-ups">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div className="flex flex-wrap items-end gap-3">
          {view !== "calendar" ? (
            <>
              <Field id="followup-enquiry-filter" label="Enquiry">
                <NativeSelect
                  id="followup-enquiry-filter"
                  aria-label="Enquiry"
                  value={enquiryFilter}
                  onChange={setEnquiryFilter}
                >
                  <option value="">All enquiries</option>
                  {crm.enquiries.items.map((enquiry) => (
                    <option key={enquiry.id} value={enquiry.id}>
                      {enquirySelectLabel(enquiry, contactById(enquiry.contactId))}
                    </option>
                  ))}
                </NativeSelect>
              </Field>
              {view === "timeline" ? (
                <Field id="followup-outcome-filter" label="Outcome">
                  <NativeSelect
                    id="followup-outcome-filter"
                    aria-label="Outcome"
                    value={outcomeFilter}
                    onChange={(value) => setOutcomeFilter(value as "all" | "open" | "closed")}
                  >
                    <option value="all">All leads</option>
                    <option value="open">Open</option>
                    <option value="closed">Closed</option>
                  </NativeSelect>
                </Field>
              ) : (
                <Field id="followup-stage-filter" label="Stage">
                  <NativeSelect
                    id="followup-stage-filter"
                    aria-label="Stage"
                    value={stageFilter}
                    onChange={setStageFilter}
                  >
                    <option value="">All stages</option>
                    {enquiryStatusOptions()}
                  </NativeSelect>
                </Field>
              )}
              <Field id="followup-due-filter" label="When">
                <NativeSelect
                  id="followup-due-filter"
                  aria-label="When"
                  value={dueFilter}
                  onChange={(value) => setDueFilter(value as DueFilter)}
                >
                  <option value="all">All</option>
                  <option value="today">Today</option>
                  <option value="tomorrow">Tomorrow</option>
                  <option value="upcoming">Upcoming</option>
                </NativeSelect>
              </Field>
            </>
          ) : (
            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="outline"
                className="rounded-xl"
                onClick={() => setCursor(new Date(cursor.getFullYear(), cursor.getMonth() - 1, 1))}
              >
                Previous
              </Button>
              <p className="min-w-[10rem] text-center font-display text-lg font-semibold">{monthLabel}</p>
              <Button
                type="button"
                variant="outline"
                className="rounded-xl"
                onClick={() => setCursor(new Date(cursor.getFullYear(), cursor.getMonth() + 1, 1))}
              >
                Next
              </Button>
            </div>
          )}
          <div className="flex items-center gap-0.5 rounded-lg border p-1">
            <Button
              type="button"
              size="icon"
              variant={view === "table" ? "secondary" : "ghost"}
              className="h-7 w-7"
              aria-label="Table view"
              onClick={() => setView("table")}
            >
              <List className="h-4 w-4" />
            </Button>
            <Button
              type="button"
              size="icon"
              variant={view === "card" ? "secondary" : "ghost"}
              className="h-7 w-7"
              aria-label="Card view"
              onClick={() => setView("card")}
            >
              <LayoutGrid className="h-4 w-4" />
            </Button>
            <Button
              type="button"
              size="icon"
              variant={view === "calendar" ? "secondary" : "ghost"}
              className="h-7 w-7"
              aria-label="Calendar view"
              onClick={() => setView("calendar")}
            >
              <CalendarDays className="h-4 w-4" />
            </Button>
            <Button
              type="button"
              size="icon"
              variant={view === "timeline" ? "secondary" : "ghost"}
              className="h-7 w-7"
              aria-label="Timeline view"
              onClick={() => setView("timeline")}
            >
              <History className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {crm.hasPermission(CRM_PERMISSIONS.followUpsCreate) ? (
          <Button type="button" className="rounded-xl" onClick={() => openCreate()}>
            Add follow-up
          </Button>
        ) : null}
      </div>

      <ModuleStatus
        sessionReady={sessionReady}
        allowed={allowed}
        status={
          view === "calendar"
            ? calendarStatus
            : view === "timeline" && crm.enquiries.status === "loading"
              ? "loading"
              : crm.followUps.status
        }
        errorMessage={view === "calendar" ? calendarError : crm.followUps.errorMessage}
        empty={view === "calendar" ? false : listEmpty}
        emptyLabel={view === "timeline" ? "No leads to track" : "No follow-ups yet"}
        onRetry={view === "calendar" ? () => setCursor(new Date(cursor)) : reload}
      >
        {view === "table" ? (
          <FollowUpTable
            items={filteredFollowUps}
            enquiryById={enquiryById}
            onEdit={openEdit}
            onRemove={setRemoveId}
          />
        ) : view === "card" ? (
          <FollowUpCards
            items={filteredFollowUps}
            enquiryById={enquiryById}
            onEdit={openEdit}
            onRemove={setRemoveId}
          />
        ) : view === "timeline" ? (
          <FollowUpTimelines
            enquiries={timelineEnquiries}
            followUps={crm.followUps.items}
            contactName={contactName}
            canCreate={crm.hasPermission(CRM_PERMISSIONS.followUpsCreate)}
            canConvert={crm.hasPermission(CRM_PERMISSIONS.enquiriesConvert)}
            onFollow={openCreate}
            onConvert={setConvertingEnquiry}
          />
        ) : (
          <FollowUpCalendarView
            items={calendarItems}
            overdue={calendarOverdue}
            cursor={cursor}
            selectedKey={selectedKey}
            onSelectDay={setSelectedDay}
          />
        )}
      </ModuleStatus>

      <SideSheet
        open={sheetOpen}
        onOpenChange={setSheetOpen}
        title={editing ? "Edit follow-up" : "Add follow-up"}
        onSubmit={onSubmit}
        footer={
          <Button type="submit" className="rounded-xl" disabled={busy}>
            {editing ? "Save" : "Create"}
          </Button>
        }
      >
        <Field id="followup-enquiry" label="Enquiry" error={errors.enquiryId}>
          <NativeSelect
            id="followup-enquiry"
            value={form.enquiryId}
            onChange={handleEnquiryChange}
          >
            <option value="">Select enquiry</option>
            {crm.enquiries.items.map((enquiry) => (
              <option key={enquiry.id} value={enquiry.id}>
                {enquirySelectLabel(enquiry, contactById(enquiry.contactId))}
              </option>
            ))}
          </NativeSelect>
        </Field>

        <Field id="followup-stage" label="Status">
          <NativeSelect
            id="followup-stage"
            value={form.stage}
            onChange={(value) =>
              setForm((current) => ({ ...current, stage: value as CrmEnquiryStatus }))
            }
          >
            {CRM_ENQUIRY_STATUSES.map((status) => (
              <option key={status} value={status}>
                {ENQUIRY_STATUS_LABELS[status]}
              </option>
            ))}
          </NativeSelect>
        </Field>

        <Field id="followup-due" label="Activity date">
          <Input
            id="followup-due"
            type="datetime-local"
            value={form.dueAt}
            onChange={(event) =>
              setForm((current) => ({ ...current, dueAt: event.target.value }))
            }
            className="rounded-xl"
          />
        </Field>

        <Field id="followup-next" label="Next follow-up date & time" error={errors.nextFollowupDate}>
          <Input
            id="followup-next"
            type="datetime-local"
            value={form.nextFollowupDate}
            onChange={(event) =>
              setForm((current) => ({ ...current, nextFollowupDate: event.target.value }))
            }
            className="rounded-xl"
          />
        </Field>

        <Field id="followup-notes" label="Notes">
          <Textarea
            id="followup-notes"
            value={form.notes}
            onChange={(event) =>
              setForm((current) => ({ ...current, notes: event.target.value }))
            }
            className="rounded-xl"
          />
        </Field>
      </SideSheet>

      <SideSheet
        open={Boolean(selectedDay)}
        onOpenChange={(open) => {
          if (!open) setSelectedDay(null);
        }}
        title={selectedDay ? `Contact due ${formatDate(selectedDay.toISOString())}` : "Contact due"}
      >
        {selectedItems.length === 0 ? (
          <p className="text-sm text-muted-foreground">No enquiries due this day.</p>
        ) : (
          <ul className="space-y-3">
            {selectedItems.map((item) => (
              <li key={`${item.kind}-${item.enquiryId}`} className="rounded-xl border p-3">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="font-medium">{item.title}</p>
                  <Badge variant="secondary">
                    {item.kind === "new_enquiry" ? "New enquiry" : "Follow-up"}
                  </Badge>
                  <StageBadge stage={item.status} />
                  {item.overdue ? <Badge variant="destructive">Overdue</Badge> : null}
                </div>
                <p className="mt-1 text-xs text-muted-foreground">
                  Next follow-up {formatDateTime(item.nextFollowupDate)}
                </p>
              </li>
            ))}
          </ul>
        )}
      </SideSheet>

      <ConfirmRemoveDialog
        open={Boolean(removeId)}
        title="Remove follow-up"
        description="This follow-up will be hidden from the history."
        onCancel={() => setRemoveId(null)}
        onConfirm={() => {
          if (!removeId) return;
          void crm.removeFollowUp(removeId).finally(() => setRemoveId(null));
        }}
      />

      <ConvertToBookedSheet
        enquiry={convertingEnquiry}
        onClose={() => setConvertingEnquiry(null)}
      />
    </ModulePage>
  );
}
