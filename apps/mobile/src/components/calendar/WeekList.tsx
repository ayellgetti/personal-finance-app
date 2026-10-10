import { Plus } from "lucide-react";
import { AgendaItem } from "@/components/calendar/AgendaItem";
import { dayKey, isToday } from "@/lib/mobile/calendar";
import { cn } from "@/lib/utils";
import type { CrmCalendarItem } from "@/types/crm";

/** A phone-width week is a stack of day sections, not seven columns. */
export function WeekList({
  days,
  byDay,
  canAdd,
  onAdd,
  onOpen,
  onRemind,
  onFollow,
}: {
  days: Date[];
  byDay: Map<string, CrmCalendarItem[]>;
  canAdd: boolean;
  onAdd: (day: Date) => void;
  onOpen?: (item: CrmCalendarItem) => void;
  onRemind?: (item: CrmCalendarItem) => void;
  onFollow?: (item: CrmCalendarItem) => void;
}) {
  return (
    <div className="space-y-2">
      {days.map((day) => {
        const key = dayKey(day);
        const items = byDay.get(key) ?? [];
        const today = isToday(day);

        return (
          <section key={key} className="space-y-2">
            <div className="flex items-center justify-between gap-2 px-1">
              <h2
                className={cn(
                  "text-xs font-semibold uppercase tracking-wide",
                  today ? "text-primary" : "text-muted-foreground",
                )}
              >
                {day.toLocaleDateString(undefined, { weekday: "long", day: "numeric", month: "short" })}
                {today ? " · Today" : ""}
              </h2>
              {canAdd ? (
                <button
                  type="button"
                  onClick={() => onAdd(day)}
                  aria-label={`Add on ${day.toDateString()}`}
                  className="flex h-7 w-7 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground tap-highlight-none"
                >
                  <Plus className="h-4 w-4" aria-hidden />
                </button>
              ) : null}
            </div>

            {items.length === 0 ? (
              <p className="rounded-2xl border border-dashed border-border px-4 py-3 text-xs text-muted-foreground">
                Nothing scheduled.
              </p>
            ) : (
              <ul className="space-y-2">
                {items.map((item) => (
                  <li key={`${item.kind}-${item.id}`}>
                    <AgendaItem
                      item={item}
                      onOpen={onOpen ? () => onOpen(item) : undefined}
                      onRemind={onRemind ? () => onRemind(item) : undefined}
                      onFollow={onFollow ? () => onFollow(item) : undefined}
                    />
                  </li>
                ))}
              </ul>
            )}
          </section>
        );
      })}
    </div>
  );
}
