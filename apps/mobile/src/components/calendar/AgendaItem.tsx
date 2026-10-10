import { Bell, Building2, ListTodo, PhoneCall } from "lucide-react";
import { ListRow } from "@/components/ListRow";
import { RecordShortcuts } from "@/components/records/RecordShortcuts";
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

export function AgendaItem({
  item,
  onOpen,
  onRemind,
  onFollow,
}: {
  item: CrmCalendarItem;
  onOpen?: () => void;
  onRemind?: () => void;
  onFollow?: () => void;
}) {
  const Icon = KIND_ICONS[item.kind];
  const enquiryId = item.kind === "followup" ? item.id : item.enquiryId;
  const remind = onRemind && (item.contactId || enquiryId) ? onRemind : undefined;
  const follow = onFollow && enquiryId ? onFollow : undefined;

  return (
    <ListRow
      title={itemCaption(item)}
      detail={item.notes}
      value={formatTime(item.at)}
      accentClassName={KIND_ACCENT_CLASSES[item.kind]}
      onClick={onOpen}
      footer={remind || follow ? <RecordShortcuts onRemind={remind} onFollow={follow} /> : undefined}
      badge={
        <Badge
          variant="secondary"
          className={cn("gap-1 rounded-lg border-0 text-[10px]", KIND_CHIP_CLASSES[item.kind])}
        >
          <Icon className="h-3 w-3" aria-hidden />
          {KIND_LABELS[item.kind]}
        </Badge>
      }
    />
  );
}
