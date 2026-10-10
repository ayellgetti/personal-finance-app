import { FormEvent, useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { FormSheet } from "@/components/forms/FormSheet";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { humanize, toDateInputValue } from "@/lib/mobile/format";
import { createPayment, listClients, listContacts, updatePayment } from "@/lib/mobile/remote";
import { useResource } from "@/lib/mobile/use-resource";
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
  const [amount, setAmount] = useState("");
  const [type, setType] = useState<CrmPaymentType>("INCOME");
  const [mode, setMode] = useState<CrmPaymentMode>("UPI");
  const [status, setStatus] = useState<CrmPaymentStatus>("pending");
  const [paidAt, setPaidAt] = useState("");
  const [reference, setReference] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!open || !payment) return;
    setReferenceType(payment.referenceType);
    setReferenceId(payment.referenceId);
    setAmount(String(payment.amount));
    setType(payment.type);
    setMode(payment.mode);
    setStatus(payment.status);
    setPaidAt(payment.paidAt ? toDateInputValue(new Date(payment.paidAt)) : "");
    setReference(payment.reference ?? "");
  }, [open, payment]);

  const loadClients = useCallback(() => listClients({ page: 1, limit: 50 }), []);
  const loadVendors = useCallback(() => listContacts({ page: 1, limit: 50, type: "vendor" }), []);
  const clients = useResource(loadClients, open && referenceType === "client");
  const vendors = useResource(loadVendors, open && referenceType === "vendor");

  const payees =
    referenceType === "vendor"
      ? (vendors.data?.items ?? []).map((contact) => ({ id: contact.id, label: contact.name }))
      : (clients.data?.items ?? []).map((client) => ({ id: client.id, label: client.billingName }));
  const payeesLoading = referenceType === "vendor" ? vendors.status === "loading" : clients.status === "loading";

  const onSubmit = async (event: FormEvent) => {
    event.preventDefault();
    const parsedAmount = Number(amount);
    if (!referenceId) {
      toast.error(referenceType === "vendor" ? "Pick a vendor" : "Pick a booked record");
      return;
    }
    if (!Number.isFinite(parsedAmount) || parsedAmount <= 0) {
      toast.error("Amount must be greater than 0");
      return;
    }

    const selectedClient = clients.data?.items.find((client) => client.id === referenceId);
    setBusy(true);
    try {
      const body = {
        referenceType,
        referenceId,
        enquiryId: referenceType === "client" ? (payment?.enquiryId ?? selectedClient?.convertedFromEnquiryId ?? null) : null,
        amount: parsedAmount,
        type,
        mode,
        status,
        paidAt: paidAt ? new Date(paidAt).toISOString() : null,
        reference: reference.trim() || null,
      };
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
        <Label htmlFor="payment-payee">{referenceType === "vendor" ? "Vendor" : "Booked"}</Label>
        <Select value={referenceId} onValueChange={setReferenceId}>
          <SelectTrigger id="payment-payee" className="h-11 rounded-xl">
            <SelectValue placeholder={payeesLoading ? "Loading…" : "Pick one"} />
          </SelectTrigger>
          <SelectContent className="max-h-72">
            {payees.map((payee) => (
              <SelectItem key={payee.id} value={payee.id}>
                {payee.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

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
