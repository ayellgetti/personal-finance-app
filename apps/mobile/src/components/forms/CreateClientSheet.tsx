import { FormEvent, useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { FormSheet } from "@/components/forms/FormSheet";
import { FieldError, NativeSelect } from "@/components/forms/NativeSelect";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { humanize, personLine } from "@/lib/mobile/format";
import { createClient, listContacts } from "@/lib/mobile/remote";
import { useDebounced } from "@/lib/mobile/use-debounced";
import { useResource } from "@/lib/mobile/use-resource";
import { validateClient } from "@/lib/mobile/validate";
import { CRM_CLIENT_STATUSES, type CrmClientStatus } from "@/types/crm";

/** Manual booked record for a contact already typed as a client (the API rejects other types). */
export function CreateClientSheet({
  open,
  onOpenChange,
  onCreated,
}: {
  open: boolean;
  onOpenChange: (next: boolean) => void;
  onCreated: () => void;
}) {
  const [search, setSearch] = useState("");
  const [contactId, setContactId] = useState("");
  const [billingName, setBillingName] = useState("");
  const [gstin, setGstin] = useState("");
  const [status, setStatus] = useState<CrmClientStatus>("active");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);

  const debounced = useDebounced(search, 300);
  const load = useCallback(
    () => listContacts({ page: 1, limit: 20, type: "client", search: debounced.trim() || undefined }),
    [debounced],
  );
  const contacts = useResource(load, open, debounced);

  useEffect(() => {
    if (!open) return;
    setSearch("");
    setContactId("");
    setBillingName("");
    setGstin("");
    setStatus("active");
    setErrors({});
  }, [open]);

  const pickContact = (id: string) => {
    setContactId(id);
    const contact = contacts.data?.items.find((item) => item.id === id);
    if (contact && !billingName.trim()) setBillingName(contact.companyName || contact.name);
  };

  const onSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (busy) return;
    const nextErrors = validateClient({ contactId, billingName, gstin });
    setErrors(nextErrors);
    const firstError = Object.values(nextErrors)[0];
    if (firstError) {
      toast.error(firstError);
      return;
    }
    setBusy(true);
    try {
      await createClient({ contactId, billingName: billingName.trim(), gstin: gstin.trim() || null, status });
      toast.success("Booked record created");
      onOpenChange(false);
      onCreated();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to create booked record");
    } finally {
      setBusy(false);
    }
  };

  const options = contacts.data?.items ?? [];

  return (
    <FormSheet
      open={open}
      onOpenChange={onOpenChange}
      title="New booked record"
      description="Pick a contact whose type is Client. Converting an enquiry also creates one."
      submitLabel="Create booked record"
      busy={busy}
      onSubmit={onSubmit}
    >
      <div className="space-y-2">
        <Label htmlFor="client-contact">Client contact</Label>
        <Input
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Search clients by name or mobile"
          aria-label="Search client contacts"
          className="h-11 rounded-xl text-base"
        />
        <NativeSelect id="client-contact" value={contactId} onChange={pickContact}>
          <option value="">
            {contacts.status === "loading" ? "Loading…" : options.length === 0 ? "No client contacts found" : "Select contact"}
          </option>
          {options.map((contact) => (
            <option key={contact.id} value={contact.id}>
              {personLine(contact.name, contact.mobile)}
            </option>
          ))}
        </NativeSelect>
        {contacts.status === "error" ? <FieldError message={contacts.errorMessage ?? "Unable to load contacts"} /> : null}
        <FieldError message={errors.contactId} />
      </div>
      <div className="space-y-2">
        <Label htmlFor="new-client-name">Billing name</Label>
        <Input
          id="new-client-name"
          value={billingName}
          onChange={(event) => setBillingName(event.target.value)}
          className="h-11 rounded-xl text-base"
        />
        <FieldError message={errors.billingName} />
      </div>
      <div className="space-y-2">
        <Label htmlFor="new-client-gstin">GSTIN</Label>
        <Input
          id="new-client-gstin"
          value={gstin}
          onChange={(event) => setGstin(event.target.value)}
          className="h-11 rounded-xl text-base"
        />
        <FieldError message={errors.gstin} />
      </div>
      <div className="space-y-2">
        <Label htmlFor="new-client-status">Status</Label>
        <NativeSelect id="new-client-status" value={status} onChange={(next) => setStatus(next as CrmClientStatus)}>
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
