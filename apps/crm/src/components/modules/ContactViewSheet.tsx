import { useEffect, useState } from "react";
import { ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { LeadTimeline } from "@/components/modules/LeadTimeline";
import { SheetTabButton, SheetTabList, StatusBadge } from "@/components/modules/shared";
import {
  CONTACT_TYPE_LABELS,
  ENQUIRY_STATUS_LABELS,
  EVENT_SLOT_LABELS,
  PAYMENT_MODE_LABELS,
  PAYMENT_STATUS_LABELS,
  PAYMENT_TYPE_LABELS,
  formatDate,
  formatDateTime,
  formatMoney,
} from "@/lib/crm/display";
import { pickCurrentBooking } from "@/lib/crm/booking";
import { fetchContactDetail, listClients, listEnquiries, listFollowUps, listPayments } from "@/lib/crm/remote";
import { cn } from "@/lib/utils";
import type {
  CrmCalendarEvent,
  CrmContact,
  CrmContactDetail,
  CrmEnquiry,
  CrmEnquiryWithFollowUps,
  CrmPayment,
} from "@/types/crm";

type TabId = "booking" | "enquiries" | "payments";

async function loadContactDetail(contact: CrmContact): Promise<CrmContactDetail> {
  const detail = await fetchContactDetail(contact.id);
  if (detail.enquiries.length > 0 || detail.payments.length > 0 || detail.bookings.length > 0) {
    return { ...detail, contact: detail.contact.id ? detail.contact : contact, bookings: detail.bookings ?? [] };
  }

  const [enquiriesPage, followUpsPage] = await Promise.all([
    listEnquiries({ contactId: contact.id, limit: 100 }),
    listFollowUps({ contactId: contact.id, limit: 100 }),
  ]);
  const enquiries: CrmEnquiryWithFollowUps[] = enquiriesPage.items.map((enquiry) => ({
    ...enquiry,
    followUps: followUpsPage.items.filter((followUp) => followUp.enquiryId === enquiry.id),
  }));

  let payments: CrmPayment[] = [];
  if (contact.type === "vendor") {
    payments = (await listPayments({ referenceType: "vendor", referenceId: contact.id, limit: 100 })).items;
  } else {
    const clients = await listClients({ limit: 100 });
    const client = clients.items.find((row) => row.contactId === contact.id);
    if (client) {
      payments = (await listPayments({ referenceType: "client", referenceId: client.id, limit: 100 })).items;
    }
  }

  return { contact: detail.contact.id ? detail.contact : contact, enquiries, payments, bookings: detail.bookings ?? [] };
}

export function ContactViewSheet({
  contact,
  onClose,
}: {
  contact: CrmContact | null;
  onClose: () => void;
}) {
  const [tab, setTab] = useState<TabId>("enquiries");
  const [detail, setDetail] = useState<CrmContactDetail | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!contact) {
      setDetail(null);
      setError(null);
      setTab("enquiries");
      return;
    }
    let cancelled = false;
    setLoading(true);
    setError(null);
    setTab("enquiries");
    void loadContactDetail(contact)
      .then((next) => {
        if (cancelled) return;
        setDetail(next);
        setTab(next.bookings.length > 0 ? "booking" : "enquiries");
      })
      .catch((caught: unknown) => {
        if (cancelled) return;
        setDetail(null);
        setError(caught instanceof Error ? caught.message : "Unable to load contact");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [contact]);

  const viewing = detail?.contact ?? contact;
  const enquiries = detail?.enquiries ?? [];
  const payments = detail?.payments ?? [];
  const bookings = detail?.bookings ?? [];

  return (
    <Sheet open={Boolean(contact)} onOpenChange={(open) => { if (!open) onClose(); }}>
      <SheetContent
        side="right"
        className="flex w-full flex-col gap-0 overflow-y-auto p-0 sm:max-w-xl"
      >
        {viewing ? (
          <>
            <SheetHeader className="border-b px-6 py-5">
              <div className="flex items-start justify-between gap-3 pr-6">
                <div className="min-w-0 space-y-1">
                  <SheetTitle className="truncate text-lg leading-snug">{viewing.name}</SheetTitle>
                  <SheetDescription className="text-sm">{viewing.mobile}</SheetDescription>
                </div>
                <StatusBadge status={viewing.type} label={CONTACT_TYPE_LABELS[viewing.type]} />
              </div>
            </SheetHeader>

            <div className="flex-1 space-y-5 px-6 py-5">
              <dl className="grid grid-cols-2 gap-x-4 gap-y-3 text-sm">
                <div>
                  <dt className="text-xs text-muted-foreground">Email</dt>
                  <dd className="mt-0.5 font-medium">{viewing.email ?? "—"}</dd>
                </div>
                <div>
                  <dt className="text-xs text-muted-foreground">Company</dt>
                  <dd className="mt-0.5 font-medium">{viewing.companyName ?? "—"}</dd>
                </div>
                {viewing.notes ? (
                  <div className="col-span-2">
                    <dt className="text-xs text-muted-foreground">Notes</dt>
                    <dd className="mt-0.5 whitespace-pre-wrap text-muted-foreground">{viewing.notes}</dd>
                  </div>
                ) : null}
              </dl>

              <SheetTabList label="Contact records">
                <SheetTabButton id="booking" selected={tab === "booking"} onSelect={setTab}>
                  Current booking{!loading ? ` (${bookings.length})` : ""}
                </SheetTabButton>
                <SheetTabButton id="enquiries" selected={tab === "enquiries"} onSelect={setTab}>
                  Enquiries{!loading ? ` (${enquiries.length})` : ""}
                </SheetTabButton>
                <SheetTabButton id="payments" selected={tab === "payments"} onSelect={setTab}>
                  Payments{!loading ? ` (${payments.length})` : ""}
                </SheetTabButton>
              </SheetTabList>

              {loading ? (
                <p className="text-sm text-muted-foreground">Loading…</p>
              ) : error ? (
                <div className="space-y-3">
                  <p className="text-sm text-destructive">{error}</p>
                  <Button
                    type="button"
                    variant="outline"
                    className="rounded-xl"
                    onClick={() => {
                      if (!contact) return;
                      setLoading(true);
                      setError(null);
                      void loadContactDetail(contact)
                        .then(setDetail)
                        .catch((caught: unknown) => {
                          setError(caught instanceof Error ? caught.message : "Unable to load contact");
                        })
                        .finally(() => setLoading(false));
                    }}
                  >
                    Try again
                  </Button>
                </div>
              ) : tab === "booking" ? (
                <BookingsTab bookings={bookings} enquiries={enquiries} />
              ) : tab === "enquiries" ? (
                <EnquiriesTab enquiries={enquiries} />
              ) : (
                <PaymentsTab payments={payments} />
              )}
            </div>
          </>
        ) : null}
      </SheetContent>
    </Sheet>
  );
}

function currentBooking(bookings: CrmCalendarEvent[]): CrmCalendarEvent | null {
  return pickCurrentBooking(bookings);
}

export function BookingsTab({
  bookings,
  enquiries,
}: {
  bookings: CrmCalendarEvent[];
  enquiries: CrmEnquiry[];
}) {
  if (bookings.length === 0) {
    return <p className="text-sm text-muted-foreground">No booking yet.</p>;
  }
  const current = currentBooking(bookings);
  const enquiryById = (id: string | null) => enquiries.find((enquiry) => enquiry.id === id);

  return (
    <div className="space-y-3" role="tabpanel" aria-label="Current booking">
      {bookings.map((booking) => {
        const enquiry = enquiryById(booking.enquiryId);
        const isCurrent = current?.id === booking.id;
        return (
          <article key={booking.id} className="rounded-2xl border px-4 py-4">
            <div className="flex flex-wrap items-center gap-2">
              <p className="font-medium leading-snug">{booking.title}</p>
              {isCurrent ? <StatusBadge status="booked" label="Current" /> : null}
              {booking.slot ? (
                <StatusBadge status={booking.slot} label={EVENT_SLOT_LABELS[booking.slot]} />
              ) : null}
            </div>
            <dl className="mt-3 grid grid-cols-2 gap-x-4 gap-y-3 text-sm">
              <div>
                <dt className="text-xs text-muted-foreground">Starts</dt>
                <dd className="mt-0.5 font-medium">{formatDateTime(booking.startsAt)}</dd>
              </div>
              <div>
                <dt className="text-xs text-muted-foreground">Ends</dt>
                <dd className="mt-0.5 font-medium">{formatDateTime(booking.endsAt)}</dd>
              </div>
              <div className="col-span-2">
                <dt className="text-xs text-muted-foreground">Linked enquiry</dt>
                <dd className="mt-0.5 font-medium">{enquiry?.title ?? booking.enquiryId ?? "—"}</dd>
              </div>
              {booking.notes ? (
                <div className="col-span-2">
                  <dt className="text-xs text-muted-foreground">Notes</dt>
                  <dd className="mt-0.5 whitespace-pre-wrap text-muted-foreground">{booking.notes}</dd>
                </div>
              ) : null}
            </dl>
          </article>
        );
      })}
    </div>
  );
}

export function EnquiriesTab({ enquiries }: { enquiries: CrmEnquiryWithFollowUps[] }) {
  const [collapsed, setCollapsed] = useState<Set<string>>(() => new Set());

  if (enquiries.length === 0) {
    return <p className="text-sm text-muted-foreground">No enquiries yet.</p>;
  }

  return (
    <div className="space-y-3" role="tabpanel" aria-label="Enquiries">
      {enquiries.map((enquiry) => {
        const open = !collapsed.has(enquiry.id);
        return (
          <article key={enquiry.id} className="rounded-2xl border">
            <button
              type="button"
              className="flex w-full items-start justify-between gap-3 px-4 py-3 text-left"
              aria-expanded={open}
              onClick={() =>
                setCollapsed((current) => {
                  const next = new Set(current);
                  if (next.has(enquiry.id)) next.delete(enquiry.id);
                  else next.add(enquiry.id);
                  return next;
                })
              }
            >
              <div className="min-w-0 space-y-1">
                <p className="font-medium leading-snug">{enquiry.title}</p>
                <div className="flex flex-wrap items-center gap-2">
                  <StatusBadge status={enquiry.status} label={ENQUIRY_STATUS_LABELS[enquiry.status]} />
                  <span className="text-xs text-muted-foreground">{enquiry.source}</span>
                </div>
              </div>
              <ChevronDown className={cn("mt-1 h-4 w-4 shrink-0 text-muted-foreground transition-transform", open && "rotate-180")} />
            </button>
            {open ? (
              <div className="space-y-4 border-t px-4 py-4">
                <dl className="grid grid-cols-2 gap-x-4 gap-y-3 text-sm">
                  <div>
                    <dt className="text-xs text-muted-foreground">Due date</dt>
                    <dd className="mt-0.5 font-medium">{formatDate(enquiry.dueDate)}</dd>
                  </div>
                  <div>
                    <dt className="text-xs text-muted-foreground">Next follow-up</dt>
                    <dd className="mt-0.5 font-medium">{formatDate(enquiry.nextFollowupDate)}</dd>
                  </div>
                  {enquiry.closedReason ? (
                    <div className="col-span-2">
                      <dt className="text-xs text-muted-foreground">Close reason</dt>
                      <dd className="mt-0.5 font-medium">{enquiry.closedReason}</dd>
                    </div>
                  ) : null}
                  {enquiry.notes ? (
                    <div className="col-span-2">
                      <dt className="text-xs text-muted-foreground">Notes</dt>
                      <dd className="mt-0.5 whitespace-pre-wrap text-muted-foreground">{enquiry.notes}</dd>
                    </div>
                  ) : null}
                </dl>
                <div className="space-y-3">
                  <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Follow-ups</p>
                  <LeadTimeline enquiry={enquiry} followUps={enquiry.followUps} />
                </div>
              </div>
            ) : null}
          </article>
        );
      })}
    </div>
  );
}

export function PaymentsTab({ payments }: { payments: CrmPayment[] }) {
  if (payments.length === 0) {
    return <p className="text-sm text-muted-foreground">No payments yet.</p>;
  }

  return (
    <div role="tabpanel" aria-label="Payments">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Amount</TableHead>
            <TableHead>Type</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Paid at</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {payments.map((payment) => (
            <TableRow key={payment.id}>
              <TableCell className="font-medium">
                {formatMoney(payment.amount, payment.currency)}
                <p className="text-xs font-normal text-muted-foreground">{PAYMENT_MODE_LABELS[payment.mode]}</p>
              </TableCell>
              <TableCell>
                <StatusBadge status={payment.type} label={PAYMENT_TYPE_LABELS[payment.type]} />
              </TableCell>
              <TableCell>
                <StatusBadge status={payment.status} label={PAYMENT_STATUS_LABELS[payment.status]} />
              </TableCell>
              <TableCell>{formatDateTime(payment.paidAt)}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
