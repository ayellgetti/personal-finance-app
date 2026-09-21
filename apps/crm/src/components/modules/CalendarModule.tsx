import { type ReactNode, useEffect, useMemo, useState } from "react";
import { CalendarClock, CalendarDays, CalendarRange, ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  ConfirmRemoveDialog,
  ModulePage,
  ModuleStatus,
  RemoveAction,
  SideSheet,
} from "@/components/modules/shared";
import { ClientViewSheet } from "@/components/modules/ClientViewSheet";
import {
  formatDate,
  formatDateTime,
  formatTime,
  toLocalDateKey,
} from "@/lib/crm/display";
import { listClients } from "@/lib/crm/remote";
import { cn } from "@/lib/utils";
import { useCrm } from "@/lib/crm/store";
import {
  CRM_PERMISSIONS,
  type CrmCalendarItem,
  type CrmClient,
} from "@/types/crm";

const WEEKDAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const KIND_LABELS: Record<CrmCalendarItem["kind"], string> = {
  task: "Task",
  event: "Event",
  booking: "Booked",
};

export type CalendarCreateTarget = "enquiries" | "followUps" | "clients" | "payments";

const CREATE_TARGETS: { target: CalendarCreateTarget; label: string; permission: string }[] = [
  { target: "enquiries", label: "Add enquiry", permission: CRM_PERMISSIONS.enquiriesCreate },
  { target: "followUps", label: "Add follow-up", permission: CRM_PERMISSIONS.followUpsCreate },
  { target: "clients", label: "Add booking", permission: CRM_PERMISSIONS.clientsCreate },
  { target: "payments", label: "Add payment", permission: CRM_PERMISSIONS.paymentsCreate },
];

type CalendarView = "day" | "week" | "month";

const VIEW_OPTIONS: { key: CalendarView; label: string; shortLabel: string; icon: ReactNode }[] = [
  { key: "day", label: "Day view", shortLabel: "Day", icon: <CalendarClock className="h-4 w-4" /> },
  { key: "week", label: "Week view", shortLabel: "Week", icon: <CalendarRange className="h-4 w-4" /> },
  { key: "month", label: "Month view", shortLabel: "Month", icon: <CalendarDays className="h-4 w-4" /> },
];

const MONTH_CELL_ITEM_LIMIT = 3;

function startOfDay(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function addDays(date: Date, amount: number): Date {
  const next = startOfDay(date);
  next.setDate(next.getDate() + amount);
  return next;
}

function startOfWeek(date: Date): Date {
  return addDays(date, -((date.getDay() + 6) % 7));
}

function monthGrid(month: Date): Date[] {
  const start = startOfWeek(new Date(month.getFullYear(), month.getMonth(), 1));
  return Array.from({ length: 42 }, (_, index) => addDays(start, index));
}

function weekGrid(date: Date): Date[] {
  const start = startOfWeek(date);
  return Array.from({ length: 7 }, (_, index) => addDays(start, index));
}

function visibleDays(view: CalendarView, cursor: Date): Date[] {
  if (view === "month") return monthGrid(cursor);
  if (view === "week") return weekGrid(cursor);
  return [startOfDay(cursor)];
}

function shiftCursor(view: CalendarView, cursor: Date, direction: 1 | -1): Date {
  if (view === "month") return new Date(cursor.getFullYear(), cursor.getMonth() + direction, 1);
  return addDays(cursor, direction * (view === "week" ? 7 : 1));
}

function rangeLabel(view: CalendarView, days: Date[], cursor: Date): string {
  if (view === "month") return cursor.toLocaleDateString(undefined, { month: "long", year: "numeric" });
  if (view === "day") {
    return cursor.toLocaleDateString(undefined, {
      weekday: "short",
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  }
  const first = days[0] ?? cursor;
  const last = days[days.length - 1] ?? cursor;
  const from = first.toLocaleDateString(undefined, { day: "numeric", month: "short" });
  const to = last.toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" });
  return `${from} – ${to}`;
}

function dayKey(date: Date): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

function matchBookedClient(clients: CrmClient[], item: CrmCalendarItem): CrmClient | null {
  const byEnquiry = item.enquiryId
    ? clients.find((client) => client.convertedFromEnquiryId === item.enquiryId)
    : undefined;
  const byContact = item.contactId
    ? clients.find((client) => client.contactId === item.contactId)
    : undefined;
  return byEnquiry ?? byContact ?? null;
}

export function CalendarModule({
  onOpenContact,
  onOpenPayments,
  onCreateFor,
}: {
  onOpenContact: (contactId: string) => void;
  onOpenPayments: (clientId: string) => void;
  onCreateFor?: (target: CalendarCreateTarget, date: string) => void;
}) {
  const crm = useCrm();
  const sessionReady = crm.status === "ready";
  const allowed = crm.hasPermission(CRM_PERMISSIONS.calendarRead);
  const [view, setView] = useState<CalendarView>("month");
  const [cursor, setCursor] = useState(() => new Date());
  const [detail, setDetail] = useState<CrmCalendarItem | null>(null);
  const [viewingClient, setViewingClient] = useState<CrmClient | null>(null);
  const [removeTarget, setRemoveTarget] = useState<CrmCalendarItem | null>(null);
  const [createDay, setCreateDay] = useState<Date | null>(null);

  const createTargets = CREATE_TARGETS.filter((option) => crm.hasPermission(option.permission));
  const canPickDay = Boolean(onCreateFor) && createTargets.length > 0;

  const cells = useMemo(() => visibleDays(view, cursor), [view, cursor]);
  const range = useMemo(() => {
    const from = startOfDay(cells[0] ?? cursor);
    const last = cells[cells.length - 1] ?? cursor;
    const to = new Date(last.getFullYear(), last.getMonth(), last.getDate(), 23, 59, 59, 999);
    return { from: from.toISOString(), to: to.toISOString() };
  }, [cells, cursor]);

  useEffect(() => {
    if (sessionReady && allowed) void crm.loadCalendar(range);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessionReady, allowed, range.from, range.to]);

  const byDay = useMemo(() => {
    const grouped = new Map<string, CrmCalendarItem[]>();
    for (const item of crm.calendar.items) {
      const key = dayKey(new Date(item.at));
      const list = grouped.get(key) ?? [];
      list.push(item);
      grouped.set(key, list);
    }
    for (const list of grouped.values()) {
      list.sort((a, b) => new Date(a.at).getTime() - new Date(b.at).getTime());
    }
    return grouped;
  }, [crm.calendar.items]);

  const openItem = (item: CrmCalendarItem) => {
    if (item.kind !== "booking" || !crm.hasPermission(CRM_PERMISSIONS.clientsRead)) {
      setDetail(item);
      return;
    }
    void listClients({ limit: 100 })
      .then((page) => {
        const client = matchBookedClient(page.items, item);
        if (client) setViewingClient(client);
        else setDetail(item);
      })
      .catch(() => setDetail(item));
  };

  const changeView = (next: CalendarView) => {
    setView(next);
    const today = new Date();
    const sameMonth =
      cursor.getFullYear() === today.getFullYear() && cursor.getMonth() === today.getMonth();
    if (next !== "month" && sameMonth) setCursor(startOfDay(today));
  };

  const openDay = (day: Date) => {
    setView("day");
    setCursor(startOfDay(day));
  };

  const todayKey = dayKey(new Date());
  const label = rangeLabel(view, cells, cursor);
  const dayItems = byDay.get(dayKey(cursor)) ?? [];

  const itemChip = (item: CrmCalendarItem, className: string, children: ReactNode) => (
    <button
      key={`${item.kind}-${item.id}`}
      type="button"
      className={cn(
        className,
        item.kind === "booking" ? "bg-emerald-100 text-emerald-900" : "bg-primary/10",
      )}
      onClick={(event) => {
        event.stopPropagation();
        openItem(item);
      }}
    >
      {children}
    </button>
  );

  return (
    <ModulePage
      crumb="Calendar"
      view={view}
      onViewChange={(next) => changeView(next as CalendarView)}
      viewOptions={VIEW_OPTIONS}
      showViewLabels
      toolbar={
        <div className="flex w-full items-center gap-2">
          <Button
            type="button"
            variant="outline"
            size="icon"
            className="shrink-0 rounded-xl"
            aria-label="Previous"
            onClick={() => setCursor(shiftCursor(view, cursor, -1))}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button
            type="button"
            variant="outline"
            size="icon"
            className="shrink-0 rounded-xl"
            aria-label="Next"
            onClick={() => setCursor(shiftCursor(view, cursor, 1))}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
          <p className="min-w-0 flex-1 truncate font-display text-base font-semibold sm:text-lg">
            {label}
          </p>
          <Button
            type="button"
            variant="outline"
            className="shrink-0 rounded-xl"
            onClick={() => setCursor(new Date())}
          >
            Today
          </Button>
        </div>
      }
    >
      <ModuleStatus
        sessionReady={sessionReady}
        allowed={allowed}
        status={crm.calendar.status}
        errorMessage={crm.calendar.errorMessage}
        empty={false}
        emptyLabel=""
        onRetry={() => void crm.loadCalendar(range)}
      >
        {view === "month" ? (
          <div className="rounded-2xl border">
            <div className="grid grid-cols-7 border-b bg-muted/40 text-center text-[10px] font-semibold uppercase tracking-wide text-muted-foreground sm:text-xs">
              {WEEKDAYS.map((day) => (
                <div key={day} className="px-0.5 py-2 sm:px-2">
                  {day}
                </div>
              ))}
            </div>
            <div className="grid grid-cols-7">
              {cells.map((day) => {
                const items = byDay.get(dayKey(day)) ?? [];
                const shown = items.slice(0, MONTH_CELL_ITEM_LIMIT);
                const hiddenCount = items.length - shown.length;
                const outside = day.getMonth() !== cursor.getMonth();
                const isToday = dayKey(day) === todayKey;
                return (
                  <div
                    key={day.toISOString()}
                    className={cn(
                      "min-h-[4.5rem] border-b border-r p-1 text-left align-top sm:min-h-[7.5rem] sm:p-2",
                      outside && "bg-muted/30 text-muted-foreground",
                      isToday && "bg-primary/5",
                      canPickDay && "cursor-pointer",
                    )}
                    onClick={(event) => {
                      if (!canPickDay) return;
                      if ((event.target as HTMLElement).closest("button")) return;
                      setCreateDay(day);
                    }}
                  >
                    <p
                      className={cn(
                        "mb-1 text-[11px] font-semibold sm:text-xs",
                        isToday && "text-primary",
                      )}
                    >
                      {day.getDate()}
                    </p>
                    <div className="space-y-0.5 sm:space-y-1">
                      {shown.map((item) =>
                        itemChip(
                          item,
                          "block w-full truncate rounded-md px-1 py-0.5 text-left text-[10px] leading-tight sm:px-1.5 sm:py-1 sm:text-xs",
                          item.title,
                        ),
                      )}
                      {hiddenCount > 0 ? (
                        <button
                          type="button"
                          className="block w-full truncate rounded-md px-1 py-0.5 text-left text-[10px] font-medium text-muted-foreground hover:text-foreground sm:px-1.5 sm:text-xs"
                          onClick={(event) => {
                            event.stopPropagation();
                            openDay(day);
                          }}
                        >
                          +{hiddenCount} more
                        </button>
                      ) : null}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ) : null}

        {view === "week" ? (
          <div className="grid grid-cols-1 divide-y rounded-2xl border sm:grid-cols-7 sm:divide-x sm:divide-y-0">
            {cells.map((day, index) => {
              const items = byDay.get(dayKey(day)) ?? [];
              const isToday = dayKey(day) === todayKey;
              return (
                <div
                  key={day.toISOString()}
                  className={cn(
                    "min-h-[3.5rem] p-2 text-left align-top sm:min-h-[18rem]",
                    isToday && "bg-primary/5",
                    canPickDay && "cursor-pointer",
                  )}
                  onClick={(event) => {
                    if (!canPickDay) return;
                    if ((event.target as HTMLElement).closest("button")) return;
                    setCreateDay(day);
                  }}
                >
                  <p className="mb-1.5 flex items-baseline gap-1.5 text-xs font-semibold sm:flex-col sm:gap-0.5">
                    <span className="uppercase tracking-wide text-muted-foreground">
                      {WEEKDAYS[index]}
                    </span>
                    <span className={cn("text-sm", isToday && "text-primary")}>{day.getDate()}</span>
                  </p>
                  <div className="space-y-1">
                    {items.map((item) =>
                      itemChip(
                        item,
                        "block w-full rounded-md px-1.5 py-1 text-left text-xs",
                        <>
                          <span className="block text-[10px] font-medium opacity-70">
                            {formatTime(item.at)}
                          </span>
                          <span className="block break-words">{item.title}</span>
                        </>,
                      ),
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        ) : null}

        {view === "day" ? (
          <div className="rounded-2xl border">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b bg-muted/40 px-4 py-2">
              <p className="text-sm font-semibold">
                {cursor.toLocaleDateString(undefined, {
                  weekday: "long",
                  day: "numeric",
                  month: "long",
                })}
              </p>
              {canPickDay ? (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="rounded-xl"
                  onClick={() => setCreateDay(startOfDay(cursor))}
                >
                  Add on this day
                </Button>
              ) : null}
            </div>
            {dayItems.length ? (
              <ul className="divide-y">
                {dayItems.map((item) => (
                  <li key={`${item.kind}-${item.id}`}>
                    <button
                      type="button"
                      className="flex w-full items-start gap-3 px-4 py-3 text-left hover:bg-muted/40"
                      onClick={() => openItem(item)}
                    >
                      <span className="w-16 shrink-0 text-xs font-medium text-muted-foreground">
                        {formatTime(item.at)}
                      </span>
                      <span className="min-w-0 flex-1 break-words text-sm">{item.title}</span>
                      <span
                        className={cn(
                          "shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold",
                          item.kind === "booking"
                            ? "bg-emerald-100 text-emerald-900"
                            : "bg-primary/10",
                        )}
                      >
                        {KIND_LABELS[item.kind]}
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="px-4 py-6 text-sm text-muted-foreground">Nothing scheduled</p>
            )}
          </div>
        ) : null}

        {view !== "day" && crm.calendar.items.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No calendar items this {view === "month" ? "month" : "week"}
          </p>
        ) : null}
      </ModuleStatus>

      <Dialog
        open={Boolean(createDay)}
        onOpenChange={(open) => {
          if (!open) setCreateDay(null);
        }}
      >
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>{createDay ? formatDate(createDay.toISOString()) : "Add"}</DialogTitle>
            <DialogDescription>Pick what to add. The form opens in its own tab.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-2">
            {createTargets.map((option) => (
              <Button
                key={option.target}
                type="button"
                variant="outline"
                className="justify-start rounded-xl"
                onClick={() => {
                  if (!createDay) return;
                  const date = toLocalDateKey(createDay);
                  setCreateDay(null);
                  onCreateFor?.(option.target, date);
                }}
              >
                {option.label}
              </Button>
            ))}
          </div>
        </DialogContent>
      </Dialog>

      <SideSheet
        open={Boolean(detail)}
        onOpenChange={(open) => {
          if (!open) setDetail(null);
        }}
        title={detail?.title ?? "Event"}
        footer={
          detail && detail.kind !== "task" && crm.hasPermission(CRM_PERMISSIONS.calendarDelete) ? (
            <RemoveAction
              label={detail.kind === "booking" ? "Remove booking" : "Remove event"}
              onClick={() => setRemoveTarget(detail)}
            />
          ) : null
        }
      >
        {detail ? (
          <div className="space-y-2 text-sm">
            <p>
              <span className="font-medium">Type:</span> {KIND_LABELS[detail.kind]}
            </p>
            <p>
              <span className="font-medium">Starts:</span> {formatDateTime(detail.at)}
            </p>
            {detail.endsAt ? (
              <p>
                <span className="font-medium">Ends:</span> {formatDateTime(detail.endsAt)}
              </p>
            ) : null}
          </div>
        ) : null}
      </SideSheet>

      <ClientViewSheet
        client={viewingClient}
        onClose={() => setViewingClient(null)}
        onOpenContact={(contactId) => {
          setViewingClient(null);
          onOpenContact(contactId);
        }}
        onOpenPayments={(clientId) => {
          setViewingClient(null);
          onOpenPayments(clientId);
        }}
      />

      <ConfirmRemoveDialog
        open={Boolean(removeTarget)}
        title={removeTarget?.kind === "booking" ? "Remove booking" : "Remove event"}
        description={
          removeTarget?.kind === "booking"
            ? "The enquiry linked to this booking is removed with it. A booking with a paid payment cannot be removed."
            : "This standalone meeting will be hidden from the calendar."
        }
        onCancel={() => setRemoveTarget(null)}
        onConfirm={() => {
          if (!removeTarget) return;
          void crm.removeCalendarEvent(removeTarget.id).finally(() => {
            setRemoveTarget(null);
            setDetail(null);
          });
        }}
      />
    </ModulePage>
  );
}
