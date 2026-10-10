import { FormEvent, useEffect, useState } from "react";
import { toast } from "sonner";
import { FormSheet } from "@/components/forms/FormSheet";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { humanize } from "@/lib/mobile/format";
import { updateClient } from "@/lib/mobile/remote";
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
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!client) return;
    setBillingName(client.billingName);
    setGstin(client.gstin ?? "");
    setStatus(client.status);
  }, [client]);

  const onSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (!client) return;
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
          required
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="client-gstin">GSTIN</Label>
        <Input
          id="client-gstin"
          value={gstin}
          onChange={(event) => setGstin(event.target.value)}
          className="h-11 rounded-xl text-base"
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="client-status">Status</Label>
        <Select value={status} onValueChange={(next) => setStatus(next as CrmClientStatus)}>
          <SelectTrigger id="client-status" className="h-11 rounded-xl">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {CRM_CLIENT_STATUSES.map((value) => (
              <SelectItem key={value} value={value}>
                {humanize(value)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </FormSheet>
  );
}
