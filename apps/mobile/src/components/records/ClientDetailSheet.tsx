import { useEffect, useState, type ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Textarea } from "@/components/ui/textarea";
import { formatDateTime, formatMoney, humanize } from "@/lib/mobile/format";
import { buildLeadTimeline } from "@/lib/mobile/lead-timeline";
import { fetchContactDetail, updateCalendarEvent } from "@/lib/mobile/remote";
import { cn } from "@/lib/utils";
import {
  CRM_PERMISSIONS,
  type CrmCalendarEvent,
  type CrmClient,
  type CrmContact,
  type CrmContactDetail,
  type CrmEnquiryWithFollowUps,
  type CrmPayment,
} from "@/types/crm";

type ClientTab = "booking" | "enquiries" | "payments";

const SLOT_LABELS = { morning: "Morning", evening: "Evening", full_day: "Full day" } as const;

function Fact({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs text-muted-foreground">{label}</dt>
      <dd className="mt-0.5 break-words text-sm font-medium">{value}</dd>
    </div>
  );
}

function currentBooking(bookings: CrmCalendarEvent[], enquiryId: string | null): CrmCalendarEvent | null {
  if (bookings.length === 0) return null;
  const linked = enquiryId ? bookings.filter((booking) => booking.enquiryId === enquiryId) : bookings;
  const pool = linked.length > 0 ? linked : bookings;
  const now = Date.now();
  const upcoming = pool
    .filter((booking) => new Date(booking.endsAt).getTime() >= now)
    .sort((left, right) => new Date(left.startsAt).getTime() - new Date(right.startsAt).getTime());
  return upcoming[0] ?? [...pool].sort((left, right) => new Date(right.startsAt).getTime() - new Date(left.startsAt).getTime())[0] ?? null;
}

function BookingNotes({
  booking,
  canEdit,
  onSaved,
}: {
  booking: CrmCalendarEvent;
  canEdit: boolean;
  onSaved: (notes: string | null) => void;
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
      setEditing(false);
      onSaved(updated.notes);
      toast.success("Notes saved");
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
    <section className="mt-3 space-y-2 border-t border-border pt-3">
      <div className="flex items-center justify-between gap-2">
        <p className="text-xs text-muted-foreground">Notes</p>
        <div className="flex gap-1">
          <Button type="button" size="sm" variant="ghost" className="h-7 rounded-xl px-2 text-xs" disabled={!notes} onClick={() => void copy()}>
            Copy
          </Button>
          {canEdit && !editing ? (
            <Button type="button" size="sm" variant="ghost" className="h-7 rounded-xl px-2 text-xs" onClick={() => { setDraft(notes); setEditing(true); }}>
              {notes ? "Edit notes" : "Add notes"}
            </Button>
          ) : null}
        </div>
      </div>
      {editing ? (
        <div className="space-y-2">
          <Textarea value={draft} onChange={(event) => setDraft(event.target.value)} rows={6} className="rounded-xl text-base" />
          <div className="flex justify-end gap-2">
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
    </section>
  );
}

export function ClientDetailSheet({
  client,
  permissions,
  onClose,
  onEdit,
}: {
  client: CrmClient | null;
  permissions: readonly string[];
  onClose: () => void;
  onEdit: (client: CrmClient) => void;
}) {
  const navigate = useNavigate();
  const [tab, setTab] = useState<ClientTab>("booking");
  const [detail, setDetail] = useState<CrmContactDetail | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [contactOpen, setContactOpen] = useState(false);

  const canEdit = permissions.includes(CRM_PERMISSIONS.clientsUpdate);
  const canEditNotes = permissions.includes(CRM_PERMISSIONS.calendarUpdate);
  const canReadContacts = permissions.includes(CRM_PERMISSIONS.contactsRead);

  useEffect(() => {
    setTab("booking");
    setContactOpen(false);
    setDetail(null);
    setError(null);
    if (!client || !canReadContacts) return;
    let cancelled = false;
    setLoading(true);
    void fetchContactDetail(client.contactId)
      .then((next) => {
        if (!cancelled) setDetail(next);
      })
      .catch((caught: unknown) => {
        if (!cancelled) setError(caught instanceof Error ? caught.message : "Unable to load booking");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [client, canReadContacts]);

  const contact: CrmContact | null = detail?.contact ?? null;
  const bookings = detail?.bookings ?? [];
  const current = client ? currentBooking(bookings, client.convertedFromEnquiryId) : null;
  const startsAt = client?.startsAt ?? current?.startsAt ?? null;
  const endsAt = client?.endsAt ?? current?.endsAt ?? null;
  const enquiries = (detail?.enquiries ?? []).filter(
    (enquiry) => !client?.convertedFromEnquiryId || enquiry.id === client.convertedFromEnquiryId,
  );
  const enquiryList: CrmEnquiryWithFollowUps[] = enquiries.length > 0 ? enquiries : (detail?.enquiries ?? []);
  const payments: CrmPayment[] = (detail?.payments ?? []).filter(
    (payment) => payment.referenceType === "client" && payment.referenceId === client?.id,
  );

  const tabs: { id: ClientTab; label: string }[] = [
    { id: "booking", label: `Current booking${loading ? "" : ` (${bookings.length})`}` },
    { id: "enquiries", label: `Enquiry${loading ? "" : ` (${enquiryList.length})`}` },
    { id: "payments", label: `Payments${loading ? "" : ` (${payments.length})`}` },
  ];

  return (
    <>
      <RecordSheet open={Boolean(client)} onClose={onClose}>
        {client ? (
          <>
            <div className="flex items-start justify-between gap-3 pr-8">
              <div className="min-w-0 space-y-1">
                <h2 className="truncate text-lg font-semibold leading-snug">{client.billingName}</h2>
                <p className="text-sm text-muted-foreground">{contact?.name ?? "Booked"}</p>
              </div>
              <Badge variant="secondary" className="shrink-0 rounded-full bg-emerald-500/15 text-emerald-700 dark:text-emerald-300">
                {humanize(client.status)}
              </Badge>
            </div>
            <dl className="grid grid-cols-2 gap-x-4 gap-y-3">
              <Fact label="Contact" value={contact?.name ?? "—"} />
              <Fact label="Mobile" value={contact?.mobile ?? "—"} />
              <Fact label="Start date" value={formatDateTime(startsAt)} />
              <Fact label="End date" value={formatDateTime(endsAt)} />
              <Fact label="GSTIN" value={client.gstin || "—"} />
              <Fact label="Email" value={contact?.email || "—"} />
              <Fact label="Company" value={contact?.companyName || "—"} />
            </dl>

            <div role="tablist" aria-label="Booked records" className="flex gap-1 overflow-x-auto rounded-xl bg-secondary p-1">
              {tabs.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  role="tab"
                  aria-selected={tab === item.id}
                  onClick={() => setTab(item.id)}
                  className={cn(
                    "shrink-0 rounded-lg px-3 py-1.5 text-xs font-semibold tap-highlight-none",
                    tab === item.id ? "bg-card text-foreground shadow-[var(--shadow-card)]" : "text-muted-foreground",
                  )}
                >
                  {item.label}
                </button>
              ))}
            </div>

            {loading ? <p className="text-sm text-muted-foreground">Loading…</p> : null}
            {error ? <p className="text-sm text-destructive">{error}</p> : null}

            {!loading && tab === "booking" ? (
              bookings.length === 0 ? (
                <p className="text-sm text-muted-foreground">No booking yet.</p>
              ) : (
                <div className="space-y-3" role="tabpanel">
                  {bookings.map((booking) => {
                    const enquiry = enquiryList.find((item) => item.id === booking.enquiryId) ?? detail?.enquiries.find((item) => item.id === booking.enquiryId);
                    return (
                      <article key={booking.id} className="rounded-2xl border border-border px-4 py-4">
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="font-medium leading-snug">{booking.title}</p>
                          {current?.id === booking.id ? (
                            <Badge variant="secondary" className="rounded-full bg-emerald-500/15 text-emerald-700">Current</Badge>
                          ) : null}
                          {booking.slot ? (
                            <Badge variant="secondary" className="rounded-full">{SLOT_LABELS[booking.slot]}</Badge>
                          ) : null}
                        </div>
                        <dl className="mt-3 grid grid-cols-2 gap-x-4 gap-y-3">
                          <Fact label="Starts" value={formatDateTime(booking.startsAt)} />
                          <Fact label="Ends" value={formatDateTime(booking.endsAt)} />
                          <div className="col-span-2">
                            <Fact label="Linked enquiry" value={enquiry?.title ?? "—"} />
                          </div>
                        </dl>
                        <BookingNotes
                          booking={booking}
                          canEdit={canEditNotes}
                          onSaved={(notes) => {
                            setDetail((currentDetail) =>
                              currentDetail
                                ? {
                                    ...currentDetail,
                                    bookings: currentDetail.bookings.map((item) =>
                                      item.id === booking.id ? { ...item, notes } : item,
                                    ),
                                  }
                                : currentDetail,
                            );
                          }}
                        />
                      </article>
                    );
                  })}
                </div>
              )
            ) : null}

            {!loading && tab === "enquiries" ? (
              enquiryList.length === 0 ? (
                <p className="text-sm text-muted-foreground">No enquiries yet.</p>
              ) : (
                <div className="space-y-3" role="tabpanel">
                  {enquiryList.map((enquiry) => (
                    <article key={enquiry.id} className="space-y-3 rounded-2xl border border-border px-4 py-4">
                      <p className="font-medium leading-snug">{enquiry.title}</p>
                      <dl className="grid grid-cols-2 gap-x-4 gap-y-3">
                        <Fact label="Due date" value={formatDateTime(enquiry.dueDate)} />
                        <Fact label="Next follow-up" value={formatDateTime(enquiry.nextFollowupDate)} />
                      </dl>
                      <ol className="space-y-2">
                        {buildLeadTimeline(enquiry, enquiry.followUps).map((event) => (
                          <li key={event.id}>
                            <p className="text-sm font-medium">{event.title}</p>
                            <p className="text-xs text-muted-foreground">{formatDateTime(event.at)}</p>
                          </li>
                        ))}
                      </ol>
                    </article>
                  ))}
                </div>
              )
            ) : null}

            {!loading && tab === "payments" ? (
              payments.length === 0 ? (
                <p className="text-sm text-muted-foreground">No payments yet.</p>
              ) : (
                <ul className="space-y-2" role="tabpanel">
                  {payments.map((payment) => (
                    <li key={payment.id} className="rounded-2xl border border-border px-4 py-3">
                      <p className="text-sm font-semibold">{formatMoney(payment.amount, payment.currency)}</p>
                      <p className="text-xs text-muted-foreground">
                        {humanize(payment.type)} · {humanize(payment.status)} · {formatDateTime(payment.paidAt)}
                      </p>
                    </li>
                  ))}
                </ul>
              )
            ) : null}

            <div className="flex flex-wrap gap-2">
              <Button type="button" size="sm" variant="outline" className="rounded-xl" disabled={!contact} onClick={() => setContactOpen(true)}>
                Contact
              </Button>
              <Button
                type="button"
                size="sm"
                variant="outline"
                className="rounded-xl"
                onClick={() => {
                  onClose();
                  navigate(`/payments?client=${client.id}`);
                }}
              >
                Payments
              </Button>
              {canEdit ? (
                <Button type="button" size="sm" variant="outline" className="rounded-xl" onClick={() => onEdit(client)}>
                  Edit
                </Button>
              ) : null}
            </div>
          </>
        ) : null}
      </RecordSheet>

      <RecordSheet open={contactOpen && Boolean(contact)} onClose={() => setContactOpen(false)} title={contact?.name ?? "Contact"}>
        {contact ? (
          <dl className="grid grid-cols-2 gap-x-4 gap-y-3">
            <Fact label="Mobile" value={contact.mobile} />
            <Fact label="Type" value={humanize(contact.type)} />
            <Fact label="Email" value={contact.email || "—"} />
            <Fact label="Company" value={contact.companyName || "—"} />
            {contact.notes ? (
              <div className="col-span-2">
                <Fact label="Notes" value={contact.notes} />
              </div>
            ) : null}
          </dl>
        ) : null}
      </RecordSheet>
    </>
  );
}

function RecordSheet({
  open,
  onClose,
  title,
  children,
}: {
  open: boolean;
  onClose: () => void;
  title?: string;
  children: ReactNode;
}) {
  return (
    <Sheet open={open} onOpenChange={(next) => (next ? undefined : onClose())}>
      <SheetContent side="bottom" className="max-h-[92vh] overflow-y-auto rounded-t-3xl pb-safe">
        <div className="mx-auto w-full max-w-tablet space-y-5 pb-4">
          <SheetHeader className={title ? "text-left" : "sr-only"}>
            <SheetTitle className={title ? "pr-8 text-lg" : undefined}>{title ?? "Record"}</SheetTitle>
          </SheetHeader>
          {children}
        </div>
      </SheetContent>
    </Sheet>
  );
}
