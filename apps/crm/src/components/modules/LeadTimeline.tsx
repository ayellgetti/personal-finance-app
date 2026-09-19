import { Badge } from "@/components/ui/badge";
import { ENQUIRY_STATUS_LABELS, formatDateTime } from "@/lib/crm/display";
import { cn } from "@/lib/utils";
import type { CrmEnquiry, CrmEnquiryStatus, CrmFollowUp } from "@/types/crm";

export type LeadTimelineKind = "created" | "followup" | "next" | "closed";

export type LeadTimelineEvent = {
  id: string;
  kind: LeadTimelineKind;
  at: string;
  title: string;
  notes: string | null;
  status: CrmEnquiryStatus | null;
  overdue: boolean;
};

export function closureLabel(closedReason: string | null): string {
  if (!closedReason) return "Closed";
  if (closedReason === "Booked") return "Closed — Booked";
  return `Closed — ${closedReason}`;
}

export function buildLeadTimeline(enquiry: CrmEnquiry, followUps: CrmFollowUp[], now = new Date()): LeadTimelineEvent[] {
  const events: LeadTimelineEvent[] = [];
  if (enquiry.createdAt) {
    events.push({
      id: `created-${enquiry.id}`,
      kind: "created",
      at: enquiry.createdAt,
      title: "Lead created",
      notes: enquiry.source ? `Source: ${enquiry.source}` : null,
      status: "new",
      overdue: false,
    });
  }

  const history = [...followUps].sort(
    (left, right) => new Date(left.dueAt).getTime() - new Date(right.dueAt).getTime(),
  );
  let lastNotes: string | null = null;
  for (const followUp of history) {
    const closed = followUp.stage === "closed";
    const rawNotes = followUp.notes?.trim() ? followUp.notes : null;
    const notes = rawNotes && rawNotes === lastNotes ? null : rawNotes;
    lastNotes = rawNotes ?? lastNotes;
    events.push({
      id: followUp.id,
      kind: closed ? "closed" : "followup",
      at: followUp.dueAt,
      title: closed
        ? closureLabel(enquiry.closedReason)
        : `Follow-up — ${ENQUIRY_STATUS_LABELS[followUp.stage]}`,
      notes,
      status: followUp.stage,
      overdue: false,
    });
  }

  const hasClosedEvent = events.some((event) => event.kind === "closed");
  if (enquiry.status === "closed" && !hasClosedEvent) {
    events.push({
      id: `closed-${enquiry.id}`,
      kind: "closed",
      at: enquiry.updatedAt ?? enquiry.createdAt ?? now.toISOString(),
      title: closureLabel(enquiry.closedReason),
      notes: enquiry.closedReason,
      status: "closed",
      overdue: false,
    });
  }

  if (enquiry.status !== "closed" && enquiry.nextFollowupDate) {
    events.push({
      id: `next-${enquiry.id}`,
      kind: "next",
      at: enquiry.nextFollowupDate,
      title: "Next follow-up",
      notes: null,
      status: enquiry.status,
      overdue: new Date(enquiry.nextFollowupDate).getTime() < now.getTime(),
    });
  }

  events.sort((left, right) => new Date(left.at).getTime() - new Date(right.at).getTime());
  return events;
}

const KIND_DOT: Record<LeadTimelineKind, string> = {
  created: "bg-primary",
  followup: "bg-muted-foreground",
  next: "bg-primary",
  closed: "bg-primary",
};

export function LeadTimeline({
  enquiry,
  followUps,
}: {
  enquiry: CrmEnquiry;
  followUps: CrmFollowUp[];
}) {
  const events = buildLeadTimeline(enquiry, followUps);
  if (events.length === 0) {
    return <p className="text-xs text-muted-foreground">No timeline activity yet.</p>;
  }

  return (
    <ol className="space-y-0">
      {events.map((event, index) => (
        <li key={event.id} className="relative flex gap-3 pb-5 last:pb-0">
          {index < events.length - 1 ? (
            <span className="absolute left-[7px] top-4 h-full w-px bg-border" aria-hidden />
          ) : null}
          <span
            className={cn(
              "relative z-10 mt-1 h-4 w-4 shrink-0 rounded-full border-2 border-background",
              KIND_DOT[event.kind],
              event.overdue && "bg-destructive",
              event.kind === "closed" && enquiry.closedReason === "Booked" && "bg-emerald-600",
            )}
            aria-hidden
          />
          <div className="min-w-0 flex-1 space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              <p className="text-sm font-medium">{event.title}</p>
              {event.status && event.kind !== "created" ? (
                <Badge variant={event.kind === "closed" ? "outline" : "secondary"} className="text-xs">
                  {ENQUIRY_STATUS_LABELS[event.status]}
                </Badge>
              ) : null}
              {event.overdue ? <Badge variant="destructive">Overdue</Badge> : null}
            </div>
            <p className="text-xs text-muted-foreground">{formatDateTime(event.at)}</p>
            {event.notes ? (
              <p className="whitespace-pre-wrap text-sm text-muted-foreground">{event.notes}</p>
            ) : null}
          </div>
        </li>
      ))}
    </ol>
  );
}
