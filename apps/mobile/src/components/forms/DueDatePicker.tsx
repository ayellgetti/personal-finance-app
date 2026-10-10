import { useMemo, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DUE_DATE_SHORTCUTS,
  WEEKDAYS,
  dayKey,
  dueDateShortcutKey,
  monthGrid,
  parseDateKey,
  startOfDay,
  type DueDateShortcutId,
} from "@/lib/mobile/calendar";
import { formatDate } from "@/lib/mobile/format";
import { cn } from "@/lib/utils";

function dayLabel(date: Date): string {
  return date.toLocaleDateString(undefined, {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

function startOfMonth(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

/** Enquiry due date: 7-day and month shortcuts, then a Monday-first month grid. */
export function DueDatePicker({
  id,
  labelledBy,
  value,
  onChange,
  from,
}: {
  id?: string;
  labelledBy?: string;
  value: string;
  onChange: (value: string) => void;
  from?: Date;
}) {
  const [today] = useState(() => startOfDay(from ?? new Date()));
  const selected = parseDateKey(value);
  const [cursor, setCursor] = useState(() => startOfMonth(selected ?? today));
  const [seenValue, setSeenValue] = useState(value);
  if (value !== seenValue) {
    setSeenValue(value);
    setCursor(startOfMonth(selected ?? today));
  }
  const cells = useMemo(() => monthGrid(cursor), [cursor]);
  const todayKey = dayKey(today);
  const monthLabel = cursor.toLocaleDateString(undefined, { month: "long", year: "numeric" });

  const applyShortcut = (shortcutId: DueDateShortcutId) => {
    onChange(dueDateShortcutKey(shortcutId, today));
  };

  return (
    <div
      id={id}
      role="group"
      aria-labelledby={labelledBy}
      className="space-y-3 rounded-xl border border-border bg-background p-3"
    >
      <div className="flex flex-wrap gap-1.5">
        {DUE_DATE_SHORTCUTS.map((shortcut) => {
          const key = dueDateShortcutKey(shortcut.id, today);
          const pressed = value === key;
          return (
            <Button
              key={shortcut.id}
              type="button"
              size="sm"
              variant={pressed ? "default" : "outline"}
              className="rounded-full"
              aria-pressed={pressed}
              onClick={() => applyShortcut(shortcut.id)}
            >
              {shortcut.label}
            </Button>
          );
        })}
      </div>

      <div className="flex items-center justify-between gap-2">
        <Button
          type="button"
          size="icon"
          variant="ghost"
          className="h-8 w-8 rounded-xl"
          aria-label="Previous month"
          onClick={() => setCursor(new Date(cursor.getFullYear(), cursor.getMonth() - 1, 1))}
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <p className="text-sm font-semibold">{monthLabel}</p>
        <Button
          type="button"
          size="icon"
          variant="ghost"
          className="h-8 w-8 rounded-xl"
          aria-label="Next month"
          onClick={() => setCursor(new Date(cursor.getFullYear(), cursor.getMonth() + 1, 1))}
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>

      <div className="grid grid-cols-7 gap-1 text-center text-[11px] font-medium text-muted-foreground">
        {WEEKDAYS.map((day) => (
          <span key={day}>{day}</span>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-1">
        {cells.map((day) => {
          const key = dayKey(day);
          const outside = day.getMonth() !== cursor.getMonth();
          const isSelected = key === value;
          const isCurrentDay = key === todayKey;
          const beforeMin = key < todayKey && !isSelected;
          return (
            <button
              key={key}
              type="button"
              aria-label={dayLabel(day)}
              aria-pressed={isSelected}
              disabled={beforeMin}
              className={cn(
                "h-8 rounded-lg text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                outside && "text-muted-foreground/50",
                isCurrentDay && !isSelected && "font-semibold text-primary",
                isSelected && "bg-primary text-primary-foreground",
                beforeMin && "cursor-not-allowed opacity-40",
                !isSelected && !beforeMin && "hover:bg-accent",
              )}
              onClick={() => onChange(key)}
            >
              {day.getDate()}
            </button>
          );
        })}
      </div>

      <p className="text-sm text-muted-foreground" aria-live="polite">
        {selected
          ? formatDate(new Date(selected.getFullYear(), selected.getMonth(), selected.getDate(), 12).toISOString())
          : "Pick a date"}
      </p>
    </div>
  );
}
