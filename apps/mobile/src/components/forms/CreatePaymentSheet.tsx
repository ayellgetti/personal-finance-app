import { FormEvent, useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { ChoiceSelect } from "@/components/forms/ChoiceSelect";
import { FormSheet } from "@/components/forms/FormSheet";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { isoToLocalInput } from "@/lib/mobile/booking";
import { formatDateTime, formatMoney, humanize, personLine } from "@/lib/mobile/format";
import { createPayment, listCalendarEvents, listClients, listContacts, listPayments, updatePayment } from "@/lib/mobile/remote";
import { useDebounced } from "@/lib/mobile/use-debounced";
import { useResource } from "@/lib/mobile/use-resource";
import { toPaymentBody, validatePayment } from "@/lib/mobile/validate";
import {
  CRM_PAYMENT_MODES,
  CRM_PAYMENT_STATUSES,
  CRM_PAYMENT_TYPES,
  type CrmPayment,
  type CrmPaymentMode,
  type CrmPaymentReferenceType,
  type CrmPaymentStatus,
  type CrmPaymentType,
} from "@/types/crm";

export function CreatePaymentSheet({
  open,
  onOpenChange,
  onCreated,
  payment,
}: {
  open: boolean;
  onOpenChange: (next: boolean) => void;
  onCreated: () => void;
  payment?: CrmPayment | null;
}) {
  const [referenceType, setReferenceType] = useState<CrmPaymentReferenceType>("client");
  const [referenceId, setReferenceId] = useState("");
  const [bookingId, setBookingId] = useState("");
  const [amount, setAmount] = useState("");
  const [type, setType] = useState<CrmPaymentType>("INCOME");
  const [mode, setMode] = useState<CrmPaymentMode>("UPI");
  const [status, setStatus] = useState<CrmPaymentStatus>("pending");
  const [paidAt, setPaidAt] = useState("");
  const [reference, setReference] = useState("");
  const [payeeQuery, setPayeeQuery] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);
  const payeeSearch = useDebounced(payeeQuery, 300);

  useEffect(() => {
    if (!open || !payment) return;
    setReferenceType(payment.referenceType);
    setReferenceId(payment.referenceId);
    setBookingId(payment.bookingId ?? "");
    setAmount(String(payment.amount));
    setType(payment.type);
    setMode(payment.mode);
    setStatus(payment.status);
    setPaidAt(payment.paidAt ? isoToLocalInput(payment.paidAt) : "");
    setReference(payment.reference ?? "");
  }, [open, payment]);

  const loadClients = useCallback(
    () => listClients({ page: 1, limit: 20, search: payeeSearch || undefined }),
    [payeeSearch],
  );
  const loadVendors = useCallback(
    () => listContacts({ page: 1, limit: 20, type: "vendor", search: payeeSearch || undefined }),
    [payeeSearch],
  );
  const loadClientContacts = useCallback(
    () => listContacts({ page: 1, limit: 20, type: "client", search: payeeSearch || undefined }),
    [payeeSearch],
  );
  const clients = useResource(loadClients, open && referenceType === "client", payeeSearch);
  const clientContacts = useResource(loadClientContacts, open && referenceType === "client", payeeSearch);
  const vendors = useResource(loadVendors, open && referenceType === "vendor", payeeSearch);
  const selectedClient = (clients.data?.items ?? []).find((client) => client.id === referenceId) ?? null;
  const loadBookings = useCallback(
    () => listCalendarEvents({ contactId: selectedClient?.contactId ?? "", limit: 50 }),
    [selectedClient?.contactId],
  );
  const bookingList = useResource(
    loadBookings,
    open && referenceType === "client" && Boolean(selectedClient?.contactId),
    selectedClient?.contactId ?? "",
  );
  const loadPaid = useCallback(() => listPayments({ bookingId, limit: 100 }), [bookingId]);
  const paidPage = useResource(loadPaid, open && Boolean(bookingId), bookingId);

  const payees =
    referenceType === "vendor"
      ? (vendors.data?.items ?? []).map((contact) => ({
          value: contact.id,
          label: contact.name,
          detail: contact.mobile,
          text: personLine(contact.name, contact.mobile),
        }))
      : (clients.data?.items ?? []).map((client) => {
          const contact = clientContacts.data?.items.find((item) => item.id === client.contactId);
          const name = contact?.name ?? client.billingName;
          return {
            value: client.id,
            label: name,
            detail: contact?.mobile,
            text: personLine(name, contact?.mobile),
          };
        });
  const payeesLoading = referenceType === "vendor" ? vendors.status === "loading" : clients.status === "loading";
  const payeeOptions =
    referenceId && !payees.some((payee) => payee.value === referenceId)
      ? [{ value: referenceId, label: "Current record" }, ...payees]
      : payees;
  const bookings = bookingList.data?.items ?? [];
  const bookingTotal = (paidPage.data?.items ?? [])
    .filter((item) => item.status === "paid" && item.type === "INCOME")
    .reduce((sum, item) => sum + item.amount, 0);

  const onSubmit = async (event: FormEvent) => {
    event.preventDefault();
    const nextErrors = validatePayment({ referenceId, amount, reference, paidAt });
    if (referenceType === "client" && bookings.length > 0 && !bookingId) {
      nextErrors.bookingId = "Choose the booking this payment belongs to";
    }
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) {
      toast.error(nextErrors.referenceId ?? nextErrors.amount ?? nextErrors.paidAt ?? "Check the payment");
      return;
    }

    const selectedClient = clients.data?.items.find((client) => client.id === referenceId);
    setBusy(true);
    try {
      const body = toPaymentBody({
        referenceType,
        referenceId,
        enquiryId: referenceType === "client" ? (payment?.enquiryId ?? selectedClient?.convertedFromEnquiryId ?? null) : null,
        bookingId: referenceType === "client" ? bookingId || null : null,
        amount,
        type,
        mode,
        status,
        paidAt,
        reference,
      });
      if (payment) {
        await updatePayment(payment.id, body);
        toast.success("Payment updated");
      } else {
        await createPayment(body);
        toast.success("Payment created");
      }
      setReferenceId("");
      setAmount("");
      setPaidAt("");
      setReference("");
      onOpenChange(false);
      onCreated();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to create payment");
    } finally {
      setBusy(false);
    }
  };

  return (
    <FormSheet
      open={open}
      onOpenChange={onOpenChange}
      title={payment ? "Edit payment" : "Add payment"}
      description={payment ? "Update this payment." : "Record money against a booked record or a vendor."}
      submitLabel={payment ? "Save payment" : "Create payment"}
      busy={busy}
      onSubmit={onSubmit}
    >
      <div className="space-y-2">
        <Label htmlFor="payment-payee-type">Type</Label>
        <Select
          value={referenceType}
          onValueChange={(value) => {
            setReferenceType(value as CrmPaymentReferenceType);
            setReferenceId("");
            setBookingId("");
          }}
        >
          <SelectTrigger id="payment-payee-type" className="h-11 rounded-xl">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="client">Booked</SelectItem>
            <SelectItem value="vendor">Vendor</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="payment-payee-search">Find {referenceType === "vendor" ? "vendor" : "booking"}</Label>
        <Input
          id="payment-payee-search"
          value={payeeQuery}
          onChange={(event) => setPayeeQuery(event.target.value)}
          className="h-11 rounded-xl text-base"
          placeholder="Search by name or mobile"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="payment-payee">{referenceType === "vendor" ? "Vendor" : "Booked"}</Label>
        <ChoiceSelect
          id="payment-payee"
          value={referenceId}
          onChange={(value) => {
            setReferenceId(value);
            setBookingId("");
          }}
          showSearch={false}
          emptyLabel={payeesLoading ? "Loading…" : "Pick one"}
          options={payeeOptions}
        />
        {errors.referenceId ? <p className="text-xs text-destructive">{errors.referenceId}</p> : null}
      </div>

      {referenceType === "client" && bookings.length > 0 ? (
        <div className="space-y-2">
          <Label htmlFor="payment-booking">Booking</Label>
          <ChoiceSelect
            id="payment-booking"
            value={bookingId}
            onChange={setBookingId}
            showSearch={false}
            emptyLabel="Select booking"
            options={bookings.map((booking) => ({
              value: booking.id,
              label: booking.title,
              detail: formatDateTime(booking.startsAt),
              text: `${booking.title} · ${formatDateTime(booking.startsAt)}`,
            }))}
          />
          {bookingId && paidPage.status === "ready" ? (
            <p className="text-xs text-muted-foreground">Paid for this booking: {formatMoney(bookingTotal, "INR")}</p>
          ) : null}
          {errors.bookingId ? <p className="text-xs text-destructive">{errors.bookingId}</p> : null}
        </div>
      ) : null}

      <div className="space-y-2">
        <Label htmlFor="payment-type">Payment type</Label>
        <Select value={type} onValueChange={(value) => setType(value as CrmPaymentType)}>
          <SelectTrigger id="payment-type" className="h-11 rounded-xl">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {CRM_PAYMENT_TYPES.map((option) => (
              <SelectItem key={option} value={option}>
                {humanize(option)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="payment-amount">Amount</Label>
        <Input
          id="payment-amount"
          type="number"
          min="0.01"
          step="0.01"
          inputMode="decimal"
          value={amount}
          onChange={(event) => setAmount(event.target.value)}
          className="h-11 rounded-xl text-base"
          required
        />
        {errors.amount ? <p className="text-xs text-destructive">{errors.amount}</p> : null}
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-2">
          <Label htmlFor="payment-mode">Mode</Label>
          <Select value={mode} onValueChange={(value) => setMode(value as CrmPaymentMode)}>
            <SelectTrigger id="payment-mode" className="h-11 rounded-xl">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {CRM_PAYMENT_MODES.map((option) => (
                <SelectItem key={option} value={option}>
                  {humanize(option)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="payment-status">Status</Label>
          <Select value={status} onValueChange={(value) => setStatus(value as CrmPaymentStatus)}>
            <SelectTrigger id="payment-status" className="h-11 rounded-xl">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {CRM_PAYMENT_STATUSES.map((option) => (
                <SelectItem key={option} value={option}>
                  {humanize(option)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="payment-paid-at">Paid at</Label>
        <Input
          id="payment-paid-at"
          type="datetime-local"
          value={paidAt}
          onChange={(event) => setPaidAt(event.target.value)}
          className="h-11 rounded-xl text-base"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="payment-reference">Reference</Label>
        <Input
          id="payment-reference"
          value={reference}
          onChange={(event) => setReference(event.target.value)}
          className="h-11 rounded-xl text-base"
        />
      </div>
    </FormSheet>
  );
}
