import { Bell, FolderPlus, ListTodo, PhoneCall } from "lucide-react";
import { AgendaItem } from "@/components/calendar/AgendaItem";
import { bottomSheetCapClass } from "@/components/ui/sheet-frame";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { CREATE_TARGETS, type CreateTarget } from "@/lib/mobile/calendar";
import type { CrmCalendarItem } from "@/types/crm";

const TARGET_ICONS = {
  reminder: Bell,
  enquiry: FolderPlus,
  followUp: PhoneCall,
  task: ListTodo,
} as const;

export function DaySheet({
  day,
  items,
  targets,
  onOpenChange,
  onPick,
  onOpen,
  onRemind,
  onFollow,
}: {
  day: Date | null;
  items: CrmCalendarItem[];
  targets: readonly CreateTarget[];
  onOpenChange: (next: boolean) => void;
  onPick: (target: CreateTarget) => void;
  onOpen?: (item: CrmCalendarItem) => void;
  onRemind?: (item: CrmCalendarItem) => void;
  onFollow?: (item: CrmCalendarItem) => void;
}) {
  const options = CREATE_TARGETS.filter((option) => targets.includes(option.target));

  return (
    <Sheet open={Boolean(day)} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className={bottomSheetCapClass}>
        {day ? (
          <div className="mx-auto flex min-h-0 w-full max-w-tablet flex-1 flex-col">
            <SheetHeader className="shrink-0 border-b border-border bg-background px-4 pb-3 pr-16 pt-4 text-left">
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

            <div className="min-h-0 flex-1 space-y-4 overflow-y-auto overscroll-contain px-4 py-4">
            {items.length > 0 ? (
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
            ) : null}

            {options.length > 0 ? (
              <div className="flex flex-col gap-2">
                {options.map((option) => {
                  const Icon = TARGET_ICONS[option.target];
                  return (
                    <button
                      key={option.target}
                      type="button"
                      onClick={() => onPick(option.target)}
                      className="flex items-center gap-3 rounded-2xl border border-border bg-card px-4 py-3 text-left transition-colors hover:bg-secondary tap-highlight-none"
                    >
                      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-secondary text-primary">
                        <Icon className="h-5 w-5" aria-hidden />
                      </span>
                      <span className="min-w-0">
                        <span className="block truncate text-sm font-semibold">{option.label}</span>
                        <span className="block truncate text-xs text-muted-foreground">{option.hint}</span>
                      </span>
                    </button>
                  );
                })}
              </div>
            ) : null}
            </div>
          </div>
        ) : null}
      </SheetContent>
    </Sheet>
  );
}
