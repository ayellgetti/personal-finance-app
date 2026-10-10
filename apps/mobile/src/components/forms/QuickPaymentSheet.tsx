import { FormEvent, useEffect, useState } from "react";
import { toast } from "sonner";
import { FormSheet } from "@/components/forms/FormSheet";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { humanize } from "@/lib/mobile/format";
import { createPayment } from "@/lib/mobile/remote";
import { CRM_PAYMENT_MODES, type CrmPaymentMode, type CrmPaymentReferenceType } from "@/types/crm";

function toDateTimeLocal(date: Date): string {
  const pad = (value: number) => String(value).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

export function QuickPaymentSheet({
  client,
  onOpenChange,
  onCreated,
}: {
  client: {
    id: string;
    enquiryId: string | null;
    label: string;
    referenceType?: CrmPaymentReferenceType;
  } | null;
  onOpenChange: (next: boolean) => void;
  onCreated: () => void;
}) {
  const [amount, setAmount] = useState("");
  const [mode, setMode] = useState<CrmPaymentMode>("UPI");
  const [paidAt, setPaidAt] = useState(() => toDateTimeLocal(new Date()));
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!client) return;
    setAmount("");
    setMode("UPI");
    setPaidAt(toDateTimeLocal(new Date()));
  }, [client]);

  const onSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (!client) return;
    const parsedAmount = Number(amount);
    if (!Number.isFinite(parsedAmount) || parsedAmount <= 0) {
      toast.error("Amount must be greater than 0");
      return;
    }
    if (!paidAt) {
      toast.error("Date and time are required");
      return;
    }

    setBusy(true);
    try {
      await createPayment({
        referenceType: client.referenceType ?? "client",
        referenceId: client.id,
        enquiryId: client.enquiryId,
        amount: parsedAmount,
        type: "INCOME",
        mode,
        status: "paid",
        paidAt: new Date(paidAt).toISOString(),
      });
      toast.success("Payment added");
      onOpenChange(false);
      onCreated();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to add payment");
    } finally {
      setBusy(false);
    }
  };

  return (
    <FormSheet
      open={Boolean(client)}
      onOpenChange={onOpenChange}
      title="Add payment"
      description={client?.label ?? "Record a payment for this booking."}
      submitLabel="Add payment"
      busy={busy}
      onSubmit={onSubmit}
    >
      <div className="space-y-2">
        <Label htmlFor="quick-payment-amount">Amount</Label>
        <Input
          id="quick-payment-amount"
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
      <div className="space-y-2">
        <Label htmlFor="quick-payment-mode">Mode</Label>
        <Select value={mode} onValueChange={(value) => setMode(value as CrmPaymentMode)}>
          <SelectTrigger id="quick-payment-mode" className="h-11 rounded-xl">
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
        <Label htmlFor="quick-payment-paid-at">Date and time</Label>
        <Input
          id="quick-payment-paid-at"
          type="datetime-local"
          value={paidAt}
          onChange={(event) => setPaidAt(event.target.value)}
          className="h-11 rounded-xl text-base"
          required
        />
      </div>
    </FormSheet>
  );
}
