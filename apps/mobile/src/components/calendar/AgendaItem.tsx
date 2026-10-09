import { Bell, Building2, ListTodo, PhoneCall } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { KIND_ACCENT_CLASSES, KIND_CHIP_CLASSES, KIND_LABELS, itemCaption } from "@/lib/mobile/calendar";
import { formatTime } from "@/lib/mobile/format";
import { cn } from "@/lib/utils";
import type { CrmCalendarItem, CrmCalendarKind } from "@/types/crm";

const KIND_ICONS: Record<CrmCalendarKind, typeof Bell> = {
  task: ListTodo,
  event: Bell,
  booking: Building2,
  followup: PhoneCall,
};

export function AgendaItem({ item }: { item: CrmCalendarItem }) {
  const Icon = KIND_ICONS[item.kind];

  return (
    <div
      className={cn(
        "flex items-start gap-3 rounded-2xl border border-l-4 border-border bg-card px-4 py-3 shadow-[var(--shadow-card)]",
        KIND_ACCENT_CLASSES[item.kind],
      )}
    >
      <span className="w-14 shrink-0 pt-0.5 text-xs font-semibold tabular-nums text-muted-foreground">
        {formatTime(item.at)}
      </span>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-semibold">{itemCaption(item)}</p>
        {item.notes ? (
          <p className="mt-0.5 line-clamp-2 text-xs text-muted-foreground">{item.notes}</p>
        ) : null}
      </div>
      <Badge
        variant="secondary"
        className={cn("shrink-0 gap-1 rounded-lg border-0 text-[10px]", KIND_CHIP_CLASSES[item.kind])}
      >
        <Icon className="h-3 w-3" aria-hidden />
        {KIND_LABELS[item.kind]}
      </Badge>
    </div>
  );
}
