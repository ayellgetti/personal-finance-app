import { useCallback, useEffect, useState } from "react";
import { Mail, Pencil, Phone, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { ConfirmInline } from "@/components/ConfirmInline";
import { EmptyState, ErrorState, LoadingState } from "@/components/PageState";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { pickCurrentBooking } from "@/lib/mobile/booking";
import { formatDate, formatDateTime, formatMoney, humanize, paymentTypeClass } from "@/lib/mobile/format";
import { buildLeadTimeline } from "@/lib/mobile/lead-timeline";
import { fetchContactDetail, removeContact, updateCalendarEvent } from "@/lib/mobile/remote";
import { useResource } from "@/lib/mobile/use-resource";
import { cn } from "@/lib/utils";
import type { CrmCalendarEvent, CrmContact } from "@/types/crm";

type HubTab = "booking" | "enquiries" | "payments";

const TABS: { value: HubTab; label: string }[] = [
  { value: "booking", label: "Booking" },
  { value: "enquiries", label: "Enquiries" },
  { value: "payments", label: "Payments" },
];

function BookingNotes({
  booking,
  canEdit,
  onSaved,
}: {
  booking: CrmCalendarEvent;
  canEdit: boolean;
  onSaved: () => void;
}) {
  const [notes, setNotes] = useState(booking.notes ?? "");
  const [draft, setDraft] = useState(booking.notes ?? "");
  const [editing, setEditing] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    setNotes(booking.notes ?? "");
    setDraft(booking.notes ?? "");
    setEditing(false);
  }, [booking.id, booking.notes]);

  const save = async () => {
    setBusy(true);
    try {
      const updated = await updateCalendarEvent(booking.id, { notes: draft.trim() || null });
      setNotes(updated.notes ?? "");
      setDraft(updated.notes ?? "");
      setEditing(false);
      toast.success("Booking notes saved");
      onSaved();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to save notes");
    } finally {
      setBusy(false);
    }
  };

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(notes);
      toast.success("Notes copied");
    } catch {
      toast.error("Unable to copy notes");
    }
  };

  return (
    <div className="space-y-2 border-t border-border pt-3">
      <div className="flex items-center justify-between gap-2">
        <p className="text-xs uppercase tracking-wide text-muted-foreground">Notes</p>
        <div className="flex gap-2">
          <Button type="button" size="sm" variant="ghost" className="h-8 rounded-xl" disabled={!notes} onClick={() => void copy()}>
            Copy
          </Button>
          {canEdit && !editing ? (
            <Button type="button" size="sm" variant="ghost" className="h-8 rounded-xl" onClick={() => setEditing(true)}>
              {notes ? "Edit notes" : "Add notes"}
            </Button>
          ) : null}
        </div>
      </div>
      {editing ? (
        <div className="space-y-2">
          <Textarea value={draft} onChange={(event) => setDraft(event.target.value)} rows={4} className="rounded-xl text-base" />
          <div className="flex gap-2">
            <Button type="button" size="sm" variant="outline" className="rounded-xl" disabled={busy} onClick={() => setEditing(false)}>
              Cancel
            </Button>
            <Button type="button" size="sm" className="rounded-xl" disabled={busy} onClick={() => void save()}>
              Save notes
            </Button>
          </div>
        </div>
      ) : (
        <p className="whitespace-pre-wrap text-sm text-muted-foreground">{notes || "No notes yet."}</p>
      )}
    </div>
  );
}

export function ContactHubSheet({
  contact,
  canUpdate,
  canDelete,
  canEditBooking = false,
  onClose,
  onEdit,
  onRemoved,
}: {
  contact: CrmContact | null;
  canUpdate: boolean;
  canDelete: boolean;
  canEditBooking?: boolean;
  onClose: () => void;
  onEdit: (contact: CrmContact) => void;
  onRemoved: () => void;
}) {
  const [tab, setTab] = useState<HubTab>("booking");
  const [confirming, setConfirming] = useState(false);
  const [removing, setRemoving] = useState(false);
  const contactId = contact?.id ?? "";

  const load = useCallback(() => fetchContactDetail(contactId), [contactId]);
  const detail = useResource(load, Boolean(contactId), contactId);

  useEffect(() => {
    setTab("booking");
    setConfirming(false);
  }, [contactId]);

  const remove = async () => {
    if (!contact) return;
    setRemoving(true);
    try {
      await removeContact(contact.id);
      toast.success("Contact removed");
      setConfirming(false);
      onRemoved();
      onClose();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to remove contact");
    } finally {
      setRemoving(false);
    }
  };

  const shown = detail.data?.contact ?? contact;
  const bookings = detail.data?.bookings ?? [];
  const current = pickCurrentBooking(bookings);

  return (
    <Sheet open={Boolean(contact)} onOpenChange={(next) => (next ? undefined : onClose())}>
      <SheetContent side="bottom" className="max-h-[90vh] overflow-y-auto rounded-t-3xl pb-safe">
        {shown ? (
          <div className="mx-auto w-full max-w-tablet space-y-4 pb-4">
            <SheetHeader className="text-left">
              <SheetTitle className="font-display text-lg">{shown.name}</SheetTitle>
              <SheetDescription>
                {humanize(shown.type)}
                {shown.companyName ? ` · ${shown.companyName}` : ""}
              </SheetDescription>
            </SheetHeader>

            <div className="grid grid-cols-2 gap-2">
              <Button asChild variant="outline" className="h-11 rounded-xl">
                <a href={`tel:${shown.mobile}`}>
                  <Phone className="h-4 w-4" aria-hidden />
                  Call
                </a>
              </Button>
              {shown.email ? (
                <Button asChild variant="outline" className="h-11 rounded-xl">
                  <a href={`mailto:${shown.email}`}>
                    <Mail className="h-4 w-4" aria-hidden />
                    Email
                  </a>
                </Button>
              ) : (
                <Button type="button" variant="outline" className="h-11 rounded-xl" disabled>
                  <Mail className="h-4 w-4" aria-hidden />
                  No email
                </Button>
              )}
              {canUpdate ? (
                <Button type="button" variant="outline" className="h-11 rounded-xl" onClick={() => onEdit(shown)}>
                  <Pencil className="h-4 w-4" aria-hidden />
                  Edit
                </Button>
              ) : null}
              {canDelete ? (
                <Button
                  type="button"
                  variant="outline"
                  className="h-11 rounded-xl text-destructive"
                  onClick={() => setConfirming(true)}
                >
                  <Trash2 className="h-4 w-4" aria-hidden />
                  Remove
                </Button>
              ) : null}
            </div>

            {confirming ? (
              <ConfirmInline
                message={`Remove ${shown.name}? The contact is hidden from lists.`}
                busy={removing}
                onCancel={() => setConfirming(false)}
                onConfirm={() => void remove()}
              />
            ) : null}

            <dl className="divide-y divide-border rounded-2xl border border-border bg-card px-4">
              <div className="flex justify-between gap-3 py-2.5">
                <dt className="text-xs uppercase tracking-wide text-muted-foreground">Mobile</dt>
                <dd className="truncate text-sm font-medium">{shown.mobile}</dd>
              </div>
              <div className="flex justify-between gap-3 py-2.5">
                <dt className="text-xs uppercase tracking-wide text-muted-foreground">Email</dt>
                <dd className="truncate text-sm font-medium">{shown.email || "—"}</dd>
              </div>
              {shown.notes ? (
                <div className="py-2.5">
                  <dt className="text-xs uppercase tracking-wide text-muted-foreground">Notes</dt>
                  <dd className="mt-1 whitespace-pre-wrap text-sm">{shown.notes}</dd>
                </div>
              ) : null}
            </dl>

            <div role="group" aria-label="Contact sections" className="grid grid-cols-3 gap-1 rounded-xl bg-secondary p-1">
              {TABS.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  aria-pressed={tab === option.value}
                  onClick={() => setTab(option.value)}
                  className={cn(
                    "h-9 rounded-lg text-sm font-semibold transition-colors tap-highlight-none",
                    tab === option.value ? "bg-background shadow-sm" : "text-muted-foreground",
                  )}
                >
                  {option.label}
                </button>
              ))}
            </div>

            {detail.status === "loading" ? <LoadingState label="Loading history…" /> : null}
            {detail.status === "error" ? <ErrorState message={detail.errorMessage} onRetry={detail.reload} /> : null}
            {detail.status === "forbidden" ? <EmptyState label="Your role cannot open this contact's history." /> : null}

            {detail.status === "ready" && detail.data && tab === "booking" ? (
              bookings.length === 0 ? (
                <EmptyState label="No booking yet." />
              ) : (
                <div className="space-y-3">
                  {bookings.map((booking) => {
                    const enquiry = detail.data?.enquiries.find((item) => item.id === booking.enquiryId);
                    return (
                      <article key={booking.id} className="space-y-2 rounded-2xl border border-border bg-card p-4">
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="text-base font-semibold">{booking.title}</p>
                          {current?.id === booking.id ? (
                            <Badge className="rounded-lg text-[10px]">Current</Badge>
                          ) : null}
                          {booking.slot ? (
                            <Badge variant="secondary" className="rounded-lg text-[10px]">
                              {humanize(booking.slot)}
                            </Badge>
                          ) : null}
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {formatDateTime(booking.startsAt)} – {formatDateTime(booking.endsAt)}
                        </p>
                        <p className="text-sm">
                          <span className="text-muted-foreground">Linked enquiry · </span>
                          {enquiry?.title ?? "—"}
                        </p>
                        <BookingNotes booking={booking} canEdit={canEditBooking} onSaved={detail.reload} />
                      </article>
                    );
                  })}
                </div>
              )
            ) : null}

            {detail.status === "ready" && detail.data && tab === "enquiries" ? (
              detail.data.enquiries.length === 0 ? (
                <EmptyState label="No enquiries yet." />
              ) : (
                <div className="space-y-3">
                  {detail.data.enquiries.map((enquiry) => {
                    const timeline = buildLeadTimeline(enquiry, enquiry.followUps);
                    return (
                      <section key={enquiry.id} className="space-y-3 rounded-2xl border border-border bg-card p-4">
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <p className="truncate text-base font-semibold">{enquiry.title}</p>
                            <p className="text-xs text-muted-foreground">
                              {enquiry.source} · Due {formatDate(enquiry.dueDate)}
                            </p>
                          </div>
                          <Badge variant={enquiry.status === "closed" ? "secondary" : "default"} className="shrink-0 rounded-lg text-[10px]">
                            {humanize(enquiry.status)}
                          </Badge>
                        </div>
                        <ol aria-label={`${enquiry.title} history`} className="space-y-2">
                          {timeline.map((event) => (
                            <li key={event.id} className="border-l-2 border-border pl-3">
                              <p className={cn("text-sm font-medium", event.overdue && "text-destructive")}>{event.title}</p>
                              <p className="text-xs text-muted-foreground">{formatDateTime(event.at)}</p>
                              {event.notes ? <p className="whitespace-pre-wrap text-sm text-muted-foreground">{event.notes}</p> : null}
                            </li>
                          ))}
                        </ol>
                      </section>
                    );
                  })}
                </div>
              )
            ) : null}

            {detail.status === "ready" && detail.data && tab === "payments" ? (
              detail.data.payments.length === 0 ? (
                <EmptyState label="No payments yet." />
              ) : (
                <ul className="divide-y divide-border rounded-2xl border border-border bg-card px-4">
                  {detail.data.payments.map((payment) => (
                    <li key={payment.id} className="flex items-center justify-between gap-3 py-3">
                      <div className="min-w-0">
                        <p className="text-sm font-medium">
                          {humanize(payment.mode)} · {humanize(payment.status)}
                        </p>
                        <p className="text-xs text-muted-foreground">{payment.paidAt ? formatDateTime(payment.paidAt) : "Not paid yet"}</p>
                      </div>
                      <span className={cn("shrink-0 text-sm font-semibold tabular-nums", paymentTypeClass(payment.type))}>
                        {formatMoney(payment.amount, payment.currency)}
                      </span>
                    </li>
                  ))}
                </ul>
              )
            ) : null}
          </div>
        ) : null}
      </SheetContent>
    </Sheet>
  );
}
