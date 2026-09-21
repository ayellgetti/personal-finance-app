import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  BookingsTab,
  EnquiriesTab,
  PaymentsTab,
} from "@/components/modules/ContactViewSheet";
import { SheetTabButton, SheetTabList, StatusBadge } from "@/components/modules/shared";
import { bookingDatesForClient } from "@/lib/crm/booking";
import { CLIENT_STATUS_LABELS, formatDateTime } from "@/lib/crm/display";
import { fetchContactDetail } from "@/lib/crm/remote";
import { useCrm } from "@/lib/crm/store";
import {
  CRM_PERMISSIONS,
  type CrmClient,
  type CrmContact,
  type CrmContactDetail,
} from "@/types/crm";

type ClientViewTab = "booking" | "enquiries" | "payments";

export function ClientViewSheet({
  client,
  contact: contactProp,
  onClose,
  onOpenContact,
  onOpenPayments,
  onEdit,
}: {
  client: CrmClient | null;
  contact?: CrmContact | null;
  onClose: () => void;
  onOpenContact: (contactId: string) => void;
  onOpenPayments: (clientId: string) => void;
  onEdit?: (client: CrmClient) => void;
}) {
  const crm = useCrm();
  const [tab, setTab] = useState<ClientViewTab>("booking");
  const [detail, setDetail] = useState<CrmContactDetail | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!client) {
      setDetail(null);
      setError(null);
      setTab("booking");
      return;
    }
    let cancelled = false;
    setLoading(true);
    setError(null);
    setTab("booking");
    void fetchContactDetail(client.contactId)
      .then((next) => {
        if (cancelled) return;
        setDetail(next);
      })
      .catch((caught: unknown) => {
        if (cancelled) return;
        setDetail(null);
        setError(caught instanceof Error ? caught.message : "Unable to load booking");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [client]);

  const contact = contactProp ?? detail?.contact ?? null;
  const bookings = detail?.bookings ?? [];
  const dates = client ? bookingDatesForClient(client, bookings) : { startsAt: null, endsAt: null };
  const enquiries = (detail?.enquiries ?? []).filter(
    (enquiry) => !client?.convertedFromEnquiryId || enquiry.id === client.convertedFromEnquiryId,
  );
  const enquiryList = enquiries.length > 0 ? enquiries : (detail?.enquiries ?? []);
  const payments = (detail?.payments ?? []).filter(
    (payment) => payment.referenceType === "client" && payment.referenceId === client?.id,
  );

  return (
    <Sheet open={Boolean(client)} onOpenChange={(open) => { if (!open) onClose(); }}>
      <SheetContent side="right" className="flex w-full flex-col gap-0 overflow-y-auto p-0 sm:max-w-xl">
        {client ? (
          <>
            <SheetHeader className="border-b px-6 py-5">
              <div className="flex items-start justify-between gap-3 pr-6">
                <div className="min-w-0 space-y-1">
                  <SheetTitle className="truncate text-lg leading-snug">{client.billingName}</SheetTitle>
                  <SheetDescription className="text-sm">{contact?.name ?? "Booked"}</SheetDescription>
                </div>
                <StatusBadge status={client.status} label={CLIENT_STATUS_LABELS[client.status]} />
              </div>
            </SheetHeader>
            <div className="flex-1 space-y-5 px-6 py-5">
              <dl className="grid grid-cols-2 gap-x-4 gap-y-3 text-sm">
                <div>
                  <dt className="text-xs text-muted-foreground">Contact</dt>
                  <dd className="mt-0.5 font-medium">{contact?.name ?? client.contactId}</dd>
                </div>
                <div>
                  <dt className="text-xs text-muted-foreground">Mobile</dt>
                  <dd className="mt-0.5 font-medium">{contact?.mobile ?? "—"}</dd>
                </div>
                <div>
                  <dt className="text-xs text-muted-foreground">Start date</dt>
                  <dd className="mt-0.5 font-medium">{formatDateTime(dates.startsAt)}</dd>
                </div>
                <div>
                  <dt className="text-xs text-muted-foreground">End date</dt>
                  <dd className="mt-0.5 font-medium">{formatDateTime(dates.endsAt)}</dd>
                </div>
                <div>
                  <dt className="text-xs text-muted-foreground">GSTIN</dt>
                  <dd className="mt-0.5 font-medium">{client.gstin ?? "—"}</dd>
                </div>
                <div>
                  <dt className="text-xs text-muted-foreground">Email</dt>
                  <dd className="mt-0.5 font-medium">{contact?.email ?? "—"}</dd>
                </div>
                <div>
                  <dt className="text-xs text-muted-foreground">Company</dt>
                  <dd className="mt-0.5 font-medium">{contact?.companyName ?? "—"}</dd>
                </div>
              </dl>

              <SheetTabList label="Booked records">
                <SheetTabButton id="booking" selected={tab === "booking"} onSelect={setTab}>
                  Current booking{!loading ? ` (${bookings.length})` : ""}
                </SheetTabButton>
                <SheetTabButton id="enquiries" selected={tab === "enquiries"} onSelect={setTab}>
                  Enquiry{!loading ? ` (${enquiryList.length})` : ""}
                </SheetTabButton>
                <SheetTabButton id="payments" selected={tab === "payments"} onSelect={setTab}>
                  Payments{!loading ? ` (${payments.length})` : ""}
                </SheetTabButton>
              </SheetTabList>

              {loading ? (
                <p className="text-sm text-muted-foreground">Loading…</p>
              ) : error ? (
                <p className="text-sm text-destructive">{error}</p>
              ) : tab === "booking" ? (
                <BookingsTab bookings={bookings} enquiries={detail?.enquiries ?? []} />
              ) : tab === "enquiries" ? (
                <EnquiriesTab enquiries={enquiryList} />
              ) : (
                <PaymentsTab payments={payments} />
              )}

              <div className="flex flex-wrap gap-2">
                <Button type="button" size="sm" variant="outline" className="rounded-xl" onClick={() => onOpenContact(client.contactId)}>
                  Contact
                </Button>
                <Button type="button" size="sm" variant="outline" className="rounded-xl" onClick={() => onOpenPayments(client.id)}>
                  Payments
                </Button>
                {onEdit && crm.hasPermission(CRM_PERMISSIONS.clientsUpdate) ? (
                  <Button type="button" size="sm" variant="outline" className="rounded-xl" onClick={() => onEdit(client)}>
                    Edit
                  </Button>
                ) : null}
              </div>
            </div>
          </>
        ) : null}
      </SheetContent>
    </Sheet>
  );
}
