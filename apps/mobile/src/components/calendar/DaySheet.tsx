import { AgendaItem } from "@/components/calendar/AgendaItem";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { CREATE_TARGETS, type CreateTarget } from "@/lib/mobile/calendar";
import type { CrmCalendarItem } from "@/types/crm";

export function DaySheet({
  day,
  items,
  targets,
  onOpenChange,
  onPick,
}: {
  day: Date | null;
  items: CrmCalendarItem[];
  targets: readonly CreateTarget[];
  onOpenChange: (next: boolean) => void;
  onPick: (target: CreateTarget) => void;
}) {
  const options = CREATE_TARGETS.filter((option) => targets.includes(option.target));

  return (
    <Sheet open={Boolean(day)} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="max-h-[85vh] overflow-y-auto rounded-t-3xl pb-safe">
        {day ? (
          <div className="mx-auto w-full max-w-md space-y-4 pb-4">
            <SheetHeader className="text-left">
              <SheetTitle className="font-display text-lg">
                {day.toLocaleDateString(undefined, {
                  weekday: "long",
                  day: "numeric",
                  month: "long",
                })}
              </SheetTitle>
              <SheetDescription>
                {items.length === 0
                  ? "Nothing scheduled yet."
                  : `${items.length} item${items.length === 1 ? "" : "s"} on this day.`}
              </SheetDescription>
            </SheetHeader>

            {items.length > 0 ? (
              <ul className="space-y-2">
                {items.map((item) => (
                  <li key={`${item.kind}-${item.id}`}>
                    <AgendaItem item={item} />
                  </li>
                ))}
              </ul>
            ) : null}

            {options.length > 0 ? (
              <div className="space-y-2">
                <p className="px-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Add on this day
                </p>
                <div className="grid grid-cols-2 gap-2">
                  {options.map((option) => (
                    <Button
                      key={option.target}
                      type="button"
                      variant="outline"
                      className="h-11 justify-start rounded-xl text-sm"
                      onClick={() => onPick(option.target)}
                    >
                      {option.label}
                    </Button>
                  ))}
                </div>
              </div>
            ) : null}
          </div>
        ) : null}
      </SheetContent>
    </Sheet>
  );
}
