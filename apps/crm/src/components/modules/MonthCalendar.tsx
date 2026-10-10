import { useMemo } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { dayKey, monthGrid, type MonthChip } from "@/components/modules/month-calendar";
import { cn } from "@/lib/utils";

const WEEKDAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const MONTH_CELL_ITEM_LIMIT = 3;

export function MonthNav({
  cursor,
  onChange,
}: {
  cursor: Date;
  onChange: (next: Date) => void;
}) {
  const label = cursor.toLocaleDateString(undefined, { month: "long", year: "numeric" });
  return (
    <div className="flex w-full items-center gap-2">
      <Button
        type="button"
        variant="outline"
        size="icon"
        className="shrink-0 rounded-xl"
        aria-label="Previous month"
        onClick={() => onChange(new Date(cursor.getFullYear(), cursor.getMonth() - 1, 1))}
      >
        <ChevronLeft className="h-4 w-4" />
      </Button>
      <Button
        type="button"
        variant="outline"
        size="icon"
        className="shrink-0 rounded-xl"
        aria-label="Next month"
        onClick={() => onChange(new Date(cursor.getFullYear(), cursor.getMonth() + 1, 1))}
      >
        <ChevronRight className="h-4 w-4" />
      </Button>
      <p className="min-w-0 flex-1 truncate font-display text-base font-semibold sm:text-lg">{label}</p>
      <Button type="button" variant="outline" className="shrink-0 rounded-xl" onClick={() => onChange(new Date())}>
        Today
      </Button>
    </div>
  );
}

export function MonthCalendar({
  cursor,
  byDay,
  onOpen,
}: {
  cursor: Date;
  byDay: Map<string, MonthChip[]>;
  onOpen?: (id: string) => void;
}) {
  const cells = useMemo(() => monthGrid(cursor), [cursor]);
  const todayKey = dayKey(new Date());

  return (
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
          const key = dayKey(day);
          const dayItems = byDay.get(key) ?? [];
          const shown = dayItems.slice(0, MONTH_CELL_ITEM_LIMIT);
          const hiddenCount = dayItems.length - shown.length;
          const outside = day.getMonth() !== cursor.getMonth();
          const isToday = key === todayKey;
          return (
            <div
              key={key}
              className={cn(
                "min-h-[4.5rem] border-b border-r p-1 text-left align-top sm:min-h-[7.5rem] sm:p-2",
                outside && "bg-muted/30 text-muted-foreground",
                isToday && "bg-primary/5",
              )}
            >
              <p className={cn("mb-1 text-[11px] font-semibold sm:text-xs", isToday && "text-primary")}>
                {day.getDate()}
              </p>
              <div className="space-y-0.5 sm:space-y-1">
                {shown.map((item) =>
                  onOpen ? (
                    <button
                      key={item.id}
                      type="button"
                      className={cn(
                        "block w-full truncate rounded-md px-1 py-0.5 text-left text-[10px] leading-tight sm:px-1.5 sm:py-1 sm:text-xs",
                        item.className,
                      )}
                      onClick={() => onOpen(item.id)}
                    >
                      {item.label}
                    </button>
                  ) : (
                    <p
                      key={item.id}
                      className={cn(
                        "truncate rounded-md px-1 py-0.5 text-[10px] leading-tight sm:px-1.5 sm:py-1 sm:text-xs",
                        item.className,
                      )}
                    >
                      {item.label}
                    </p>
                  ),
                )}
                {hiddenCount > 0 ? (
                  <p className="truncate px-1 text-[10px] text-muted-foreground sm:px-1.5 sm:text-xs">
                    +{hiddenCount} more
                  </p>
                ) : null}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
