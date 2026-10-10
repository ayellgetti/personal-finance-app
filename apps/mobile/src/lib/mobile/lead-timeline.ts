import { humanize } from "@/lib/mobile/format";
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

export function buildLeadTimeline(
  enquiry: CrmEnquiry,
  followUps: CrmFollowUp[],
  now = new Date(),
): LeadTimelineEvent[] {
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
      title: closed ? closureLabel(enquiry.closedReason) : `Follow-up — ${humanize(followUp.stage)}`,
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
