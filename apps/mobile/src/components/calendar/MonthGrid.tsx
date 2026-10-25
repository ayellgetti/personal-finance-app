import { useRef } from "react";
import {
  KIND_MARK_CLASSES,
  WEEKDAYS,
  dayKey,
  isSameMonth,
  isToday,
} from "@/lib/mobile/calendar";
import { cn } from "@/lib/utils";
import type { CrmCalendarItem, CrmCalendarKind } from "@/types/crm";

const MAX_DOTS = 4;
const SWIPE_THRESHOLD = 48;

/** One dot per kind present on the day; a cell has no room for labels. */
function kindsOn(items: readonly CrmCalendarItem[]): CrmCalendarKind[] {
  const seen: CrmCalendarKind[] = [];
  for (const item of items) {
    if (!seen.includes(item.kind)) seen.push(item.kind);
  }
  return seen;
}

export function MonthGrid({
  days,
  cursor,
  byDay,
  selectedKey,
  onSelect,
  onSwipe,
}: {
  days: Date[];
  cursor: Date;
  byDay: Map<string, CrmCalendarItem[]>;
  selectedKey: string | null;
  onSelect: (day: Date) => void;
  onSwipe?: (direction: 1 | -1) => void;
}) {
  const touchStart = useRef<{ x: number; y: number } | null>(null);
  const suppressClick = useRef(false);

  return (
    <div
      className="touch-pan-y rounded-2xl border border-border bg-card p-2 shadow-[var(--shadow-card)]"
      onTouchStart={(event) => {
        const touch = event.touches[0];
        if (!touch) return;
        touchStart.current = { x: touch.clientX, y: touch.clientY };
        suppressClick.current = false;
      }}
      onTouchEnd={(event) => {
        const start = touchStart.current;
        const touch = event.changedTouches[0];
        touchStart.current = null;
        if (!start || !touch || !onSwipe) return;
        const deltaX = touch.clientX - start.x;
        const deltaY = touch.clientY - start.y;
        if (Math.abs(deltaX) < SWIPE_THRESHOLD || Math.abs(deltaX) <= Math.abs(deltaY)) return;
        suppressClick.current = true;
        onSwipe(deltaX < 0 ? 1 : -1);
      }}
    >
      <div className="grid grid-cols-7 pb-1">
        {WEEKDAYS.map((weekday) => (
          <span
            key={weekday}
            className="py-1 text-center text-[10px] font-semibold uppercase tracking-wide text-muted-foreground"
          >
            {weekday.slice(0, 1)}
          </span>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-0.5">
        {days.map((day) => {
          const key = dayKey(day);
          const items = byDay.get(key) ?? [];
          const outside = !isSameMonth(day, cursor);
          const today = isToday(day);
          const selected = key === selectedKey;

          return (
            <button
              key={key}
              type="button"
              onClick={() => {
                if (suppressClick.current) {
                  suppressClick.current = false;
                  return;
                }
                onSelect(day);
              }}
              aria-label={`${day.toDateString()}, ${items.length} item${items.length === 1 ? "" : "s"}`}
              aria-pressed={selected}
              className={cn(
                "flex h-12 flex-col items-center justify-start gap-1 rounded-xl pt-1.5 transition-colors tap-highlight-none",
                outside && "opacity-40",
                selected ? "bg-primary text-primary-foreground" : "hover:bg-secondary",
              )}
            >
              <span
                className={cn(
                  "flex h-6 w-6 items-center justify-center rounded-full text-xs font-semibold tabular-nums",
                  today && !selected && "bg-primary/15 text-primary",
                )}
              >
                {day.getDate()}
              </span>
              <span className="flex h-2 items-center gap-0.5">
                {kindsOn(items)
                  .slice(0, MAX_DOTS)
                  .map((kind) => (
                    <span
                      key={kind}
                      aria-hidden
                      className={cn(
                        KIND_MARK_CLASSES[kind],
                        selected && "bg-primary-foreground",
                      )}
                    />
                  ))}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
