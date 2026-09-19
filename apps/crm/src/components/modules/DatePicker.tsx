import { useMemo, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DUE_DATE_SHORTCUTS,
  dueDateShortcutKey,
  formatDate,
  localDateInputToIso,
  parseLocalDateKey,
  toLocalDateKey,
  type DueDateShortcutId,
} from "@/lib/crm/display";
import { cn } from "@/lib/utils";

const WEEKDAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

function startOfMonth(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

function monthGrid(month: Date): Date[] {
  const first = startOfMonth(month);
  const weekday = (first.getDay() + 6) % 7;
  const start = new Date(first);
  start.setDate(first.getDate() - weekday);
  return Array.from({ length: 42 }, (_, index) => {
    const day = new Date(start);
    day.setDate(start.getDate() + index);
    return day;
  });
}

function dayLabel(date: Date): string {
  return date.toLocaleDateString(undefined, {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

export function DatePicker({
  id,
  value,
  onChange,
  from,
}: {
  id?: string;
  value: string;
  onChange: (value: string) => void;
  from?: Date;
}) {
  const today = from ?? new Date();
  const selected = parseLocalDateKey(value);
  const [cursor, setCursor] = useState(() => startOfMonth(selected ?? today));
  const cells = useMemo(() => monthGrid(cursor), [cursor]);
  const todayKey = toLocalDateKey(today);
  const monthLabel = cursor.toLocaleDateString(undefined, { month: "long", year: "numeric" });

  const applyShortcut = (shortcutId: DueDateShortcutId) => {
    const next = dueDateShortcutKey(shortcutId, today);
    onChange(next);
    const parsed = parseLocalDateKey(next);
    if (parsed) setCursor(startOfMonth(parsed));
  };

  return (
    <div className="space-y-3 rounded-xl border bg-background p-3">
      <div className="flex flex-wrap gap-1.5">
        {DUE_DATE_SHORTCUTS.map((shortcut) => {
          const key = dueDateShortcutKey(shortcut.id, today);
          return (
            <Button
              key={shortcut.id}
              type="button"
              size="sm"
              variant={value === key ? "default" : "outline"}
              className="rounded-xl"
              aria-pressed={value === key}
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
          const key = toLocalDateKey(day);
          const outside = day.getMonth() !== cursor.getMonth();
          const isSelected = key === value;
          const isToday = key === todayKey;
          return (
            <button
              key={key}
              type="button"
              aria-label={dayLabel(day)}
              aria-pressed={isSelected}
              className={cn(
                "h-8 rounded-lg text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                outside && "text-muted-foreground/50",
                isToday && !isSelected && "font-semibold text-primary",
                isSelected && "bg-primary text-primary-foreground",
                !isSelected && "hover:bg-accent",
              )}
              onClick={() => {
                onChange(key);
                if (outside) setCursor(startOfMonth(day));
              }}
            >
              {day.getDate()}
            </button>
          );
        })}
      </div>

      <p id={id} className="text-sm text-muted-foreground" aria-live="polite">
        {selected ? formatDate(localDateInputToIso(value)) : "Pick a date"}
      </p>
    </div>
  );
}
