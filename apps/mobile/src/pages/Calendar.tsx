import { useCallback, useMemo, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { AgendaItem } from "@/components/calendar/AgendaItem";
import { DaySheet } from "@/components/calendar/DaySheet";
import { MonthCategories } from "@/components/calendar/MonthCategories";
import { MonthGrid } from "@/components/calendar/MonthGrid";
import { WeekList } from "@/components/calendar/WeekList";
import { CreateEnquirySheet } from "@/components/forms/CreateEnquirySheet";
import { CreateEventSheet } from "@/components/forms/CreateEventSheet";
import { CreateFollowUpSheet } from "@/components/forms/CreateFollowUpSheet";
import { CreateTaskSheet } from "@/components/forms/CreateTaskSheet";
import { EmptyState, ErrorState, ForbiddenState, LoadingState } from "@/components/PageState";
import { SearchBar } from "@/components/SearchBar";
import { Button } from "@/components/ui/button";
import {
  CALENDAR_VIEWS,
  CREATE_TARGETS,
  KIND_LABELS,
  KIND_MARK_CLASSES,
  dayKey,
  groupByDay,
  itemsInMonth,
  monthBounds,
  rangeFor,
  rangeLabel,
  shiftCursor,
  startOfDay,
  visibleDays,
  type CalendarView,
  type CreateTarget,
  type MonthCategory,
} from "@/lib/mobile/calendar";
import { matchesQuery, toDateInputValue } from "@/lib/mobile/format";
import { listCalendar, listPayments } from "@/lib/mobile/remote";
import { useMobile } from "@/lib/mobile/store";
import { useCreateIntent } from "@/lib/mobile/use-create-intent";
import { useResource } from "@/lib/mobile/use-resource";
import { cn } from "@/lib/utils";
import { CRM_PERMISSIONS, type CrmCalendarKind } from "@/types/crm";

const VIEW_LABELS: Record<CalendarView, string> = {
  day: "Day",
  week: "Week",
  month: "Month",
};

const LEGEND_KINDS: CrmCalendarKind[] = ["task", "event", "booking", "followup"];

function Legend() {
  return (
    <ul className="flex flex-wrap items-center gap-x-3 gap-y-1 px-1">
      {LEGEND_KINDS.map((kind) => (
        <li key={kind} className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
          <span className={KIND_MARK_CLASSES[kind]} aria-hidden />
          {KIND_LABELS[kind]}
        </li>
      ))}
    </ul>
  );
}

export default function Calendar() {
  const { permissions } = useMobile();
  const canRead = permissions.includes(CRM_PERMISSIONS.calendarRead);

  const [query, setQuery] = useState("");
  const [view, setView] = useState<CalendarView>("month");
  const [cursor, setCursor] = useState(() => startOfDay(new Date()));
  const [pickedDay, setPickedDay] = useState<Date | null>(null);
  const [category, setCategory] = useState<MonthCategory>("all");
  const [createFor, setCreateFor] = useState<{ target: CreateTarget; day: Date } | null>(null);

  const targets = useMemo(
    () =>
      CREATE_TARGETS.filter((option) => permissions.includes(option.permission)).map(
        (option) => option.target,
      ),
    [permissions],
  );

  // Add reminder in the header plus menu lands here with ?new=1.
  const [intentOpen, setIntentOpen] = useCreateIntent(targets.includes("reminder"));

  const days = useMemo(() => visibleDays(view, cursor), [view, cursor]);
  const range = useMemo(() => rangeFor(days, cursor), [days, cursor]);

  const canReadPayments = permissions.includes(CRM_PERMISSIONS.paymentsRead);
  const bounds = useMemo(() => monthBounds(cursor), [cursor]);
  const load = useCallback(async () => {
    const [calendar, payments] = await Promise.all([
      listCalendar(range),
      canReadPayments
        ? listPayments({ from: bounds.from, to: bounds.to, limit: 200 }).catch(() => null)
        : Promise.resolve(null),
    ]);
    return { items: calendar.items, payments: payments?.items ?? [] };
  }, [range, bounds, canReadPayments]);
  const feed = useResource(load, canRead, `${range.from}|${range.to}`);

  const visibleItems = useMemo(
    () =>
      (feed.data?.items ?? []).filter((item) =>
        matchesQuery(query, item.title, item.notes, KIND_LABELS[item.kind]),
      ),
    [feed.data, query],
  );
  const monthItems = useMemo(() => itemsInMonth(visibleItems, cursor), [visibleItems, cursor]);
  const byDay = useMemo(() => groupByDay(visibleItems), [visibleItems]);

  if (!canRead) return <ForbiddenState label="the calendar" />;

  const changeView = (next: CalendarView) => {
    setView(next);
    // Leaving month view on the current month should land on today, not the 1st.
    const today = new Date();
    if (next !== "month" && cursor.getMonth() === today.getMonth() && cursor.getFullYear() === today.getFullYear()) {
      setCursor(startOfDay(today));
    }
  };

  const openDay = (day: Date) => setPickedDay(startOfDay(day));

  const pickTarget = (target: CreateTarget) => {
    const day = pickedDay;
    if (!day) return;
    setPickedDay(null);
    setCreateFor({ target, day });
  };

  const closeCreate = (next: boolean) => {
    if (!next) setCreateFor(null);
  };

  const dayItems = pickedDay ? (byDay.get(dayKey(pickedDay)) ?? []) : [];
  const agenda = byDay.get(dayKey(cursor)) ?? [];
  const createDay = createFor?.day ?? cursor;
  const reminderOpen = createFor?.target === "reminder" || intentOpen;

  return (
    <div className="space-y-3">
      <SearchBar value={query} onChange={setQuery} placeholder="Search this view" label="Search calendar" />

      <div role="tablist" aria-label="Calendar view" className="flex rounded-xl bg-secondary p-1">
        {CALENDAR_VIEWS.map((option) => (
          <button
            key={option}
            type="button"
            role="tab"
            aria-selected={view === option}
            onClick={() => changeView(option)}
            className={cn(
              "flex-1 rounded-lg py-1.5 text-xs font-semibold transition-colors tap-highlight-none",
              view === option
                ? "bg-card text-foreground shadow-[var(--shadow-card)]"
                : "text-muted-foreground",
            )}
          >
            {VIEW_LABELS[option]}
          </button>
        ))}
      </div>

      <div className="flex items-center justify-between gap-2">
        <Button
          type="button"
          variant="ghost"
          size="icon"
          aria-label={`Previous ${view}`}
          className="h-9 w-9 rounded-xl"
          onClick={() => setCursor(shiftCursor(view, cursor, -1))}
        >
          <ChevronLeft className="h-5 w-5" aria-hidden />
        </Button>
        <div className="min-w-0 text-center">
          <p className="truncate text-sm font-semibold">{rangeLabel(view, days, cursor)}</p>
          <button
            type="button"
            className="text-[11px] text-primary tap-highlight-none"
            onClick={() => setCursor(startOfDay(new Date()))}
          >
            Today
          </button>
        </div>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          aria-label={`Next ${view}`}
          className="h-9 w-9 rounded-xl"
          onClick={() => setCursor(shiftCursor(view, cursor, 1))}
        >
          <ChevronRight className="h-5 w-5" aria-hidden />
        </Button>
      </div>

      <Legend />

      {feed.status === "error" ? (
        <ErrorState message={feed.errorMessage} onRetry={feed.reload} />
      ) : (
        <>
          {/* The grid stays mounted while a range reloads, so paging does not flash. */}
          {feed.status === "loading" ? <LoadingState label="Loading calendar…" /> : null}

          {view === "month" ? (
            <>
              <MonthGrid
                days={days}
                cursor={cursor}
                byDay={byDay}
                selectedKey={pickedDay ? dayKey(pickedDay) : null}
                onSelect={openDay}
              />
              {feed.status === "ready" ? (
                <MonthCategories
                  category={canReadPayments || category !== "payment" ? category : "all"}
                  onCategory={setCategory}
                  items={monthItems}
                  payments={feed.data?.payments ?? []}
                  query={query}
                  showPayments={canReadPayments}
                />
              ) : null}
            </>
          ) : null}

          {view === "week" ? (
            <WeekList days={days} byDay={byDay} canAdd={targets.length > 0} onAdd={openDay} />
          ) : null}

          {view === "day" ? (
            agenda.length === 0 ? (
              feed.status === "ready" ? <EmptyState label="Nothing scheduled for this day." /> : null
            ) : (
              <ul className="space-y-2">
                {agenda.map((item) => (
                  <li key={`${item.kind}-${item.id}`}>
                    <AgendaItem item={item} />
                  </li>
                ))}
              </ul>
            )
          ) : null}

          {view === "day" && targets.length > 0 ? (
            <Button
              type="button"
              variant="outline"
              className="h-11 w-full rounded-xl text-sm"
              onClick={() => setPickedDay(startOfDay(cursor))}
            >
              Add on this day
            </Button>
          ) : null}
        </>
      )}

      <DaySheet
        day={pickedDay}
        items={dayItems}
        targets={targets}
        onOpenChange={(next) => {
          if (!next) setPickedDay(null);
        }}
        onPick={pickTarget}
      />

      <CreateEventSheet
        open={reminderOpen}
        onOpenChange={(next) => {
          closeCreate(next);
          if (!next && intentOpen) setIntentOpen(false);
        }}
        day={createDay}
        onCreated={feed.reload}
      />
      <CreateEnquirySheet
        open={createFor?.target === "enquiry"}
        onOpenChange={closeCreate}
        defaultDate={toDateInputValue(createDay)}
        onCreated={feed.reload}
      />
      <CreateFollowUpSheet
        open={createFor?.target === "followUp"}
        onOpenChange={closeCreate}
        day={createDay}
        onCreated={feed.reload}
      />
      <CreateTaskSheet
        open={createFor?.target === "task"}
        onOpenChange={closeCreate}
        day={createDay}
        onCreated={feed.reload}
      />
    </div>
  );
}
