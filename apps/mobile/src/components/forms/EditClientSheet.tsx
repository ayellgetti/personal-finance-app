import { FormEvent, useEffect, useState } from "react";
import { toast } from "sonner";
import { FormSheet } from "@/components/forms/FormSheet";
import { FieldError, NativeSelect } from "@/components/forms/NativeSelect";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { humanize } from "@/lib/mobile/format";
import { updateClient } from "@/lib/mobile/remote";
import { validateClient } from "@/lib/mobile/validate";
import { CRM_CLIENT_STATUSES, type CrmClient, type CrmClientStatus } from "@/types/crm";

export function EditClientSheet({
  client,
  onOpenChange,
  onSaved,
}: {
  client: CrmClient | null;
  onOpenChange: (next: boolean) => void;
  onSaved: () => void;
}) {
  const [billingName, setBillingName] = useState("");
  const [gstin, setGstin] = useState("");
  const [status, setStatus] = useState<CrmClientStatus>("active");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!client) return;
    setBillingName(client.billingName);
    setGstin(client.gstin ?? "");
    setStatus(client.status);
    setErrors({});
  }, [client]);

  const onSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (!client || busy) return;
    const nextErrors = validateClient({ contactId: client.contactId, billingName, gstin });
    setErrors(nextErrors);
    const firstError = Object.values(nextErrors)[0];
    if (firstError) {
      toast.error(firstError);
      return;
    }
    setBusy(true);
    try {
      await updateClient(client.id, {
        billingName: billingName.trim(),
        gstin: gstin.trim() || null,
        status,
      });
      toast.success("Booking updated");
      onOpenChange(false);
      onSaved();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to update booking");
    } finally {
      setBusy(false);
    }
  };

  return (
    <FormSheet
      open={Boolean(client)}
      onOpenChange={onOpenChange}
      title="Edit booking"
      description="Update the booked record."
      submitLabel="Save booking"
      busy={busy}
      onSubmit={onSubmit}
    >
      <div className="space-y-2">
        <Label htmlFor="client-name">Billing name</Label>
        <Input
          id="client-name"
          value={billingName}
          onChange={(event) => setBillingName(event.target.value)}
          className="h-11 rounded-xl text-base"
        />
        <FieldError message={errors.billingName} />
      </div>
      <div className="space-y-2">
        <Label htmlFor="client-gstin">GSTIN</Label>
        <Input
          id="client-gstin"
          value={gstin}
          onChange={(event) => setGstin(event.target.value)}
          className="h-11 rounded-xl text-base"
        />
        <FieldError message={errors.gstin} />
      </div>
      <div className="space-y-2">
        <Label htmlFor="client-status">Status</Label>
        <NativeSelect id="client-status" value={status} onChange={(next) => setStatus(next as CrmClientStatus)}>
          {CRM_CLIENT_STATUSES.map((value) => (
            <option key={value} value={value}>
              {humanize(value)}
            </option>
          ))}
        </NativeSelect>
      </div>
    </FormSheet>
  );
}
