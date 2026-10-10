import { FormEvent, useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { DueDatePicker } from "@/components/forms/DueDatePicker";
import { FormSheet } from "@/components/forms/FormSheet";
import { FieldError, NativeSelect } from "@/components/forms/NativeSelect";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { humanize, personLine, toDateInputValue } from "@/lib/mobile/format";
import { createContact, createEnquiry, listContacts, updateEnquiry } from "@/lib/mobile/remote";
import { useDebounced } from "@/lib/mobile/use-debounced";
import { useResource } from "@/lib/mobile/use-resource";
import { toContactInput, validateContact, validateEnquiry } from "@/lib/mobile/validate";
import {
  CRM_CONTACT_TYPES,
  CRM_ENQUIRY_STATUSES,
  type CrmContactType,
  type CrmEnquiry,
  type CrmEnquiryStatus,
} from "@/types/crm";

const ENQUIRY_SOURCES = [
  "Walk-in",
  "Referral",
  "Instagram",
  "Facebook",
  "Google",
  "WhatsApp",
  "Wedding Wire",
  "Other",
] as const;

const DIAL_PATTERN = /^\+?[0-9]{7,15}$/;

function dialNumber(value: string): string {
  const trimmed = value.trim();
  const digits = trimmed.replace(/\D/g, "");
  return trimmed.startsWith("+") ? `+${digits}` : digits;
}

export function CreateEnquirySheet({
  open,
  onOpenChange,
  onCreated,
  defaultDate,
  enquiry,
}: {
  open: boolean;
  onOpenChange: (next: boolean) => void;
  onCreated: () => void;
  defaultDate?: string;
  enquiry?: CrmEnquiry | null;
}) {
  const [contactMode, setContactMode] = useState<"existing" | "new">("new");
  const [contactId, setContactId] = useState("");
  const [contactSearch, setContactSearch] = useState("");
  const [newName, setNewName] = useState("");
  const [newMobile, setNewMobile] = useState("");
  const [newType, setNewType] = useState<CrmContactType>("lead");
  const [title, setTitle] = useState("");
  const [source, setSource] = useState("");
  const [status, setStatus] = useState<CrmEnquiryStatus>("new");
  const [closedReason, setClosedReason] = useState("");
  const [dueDate, setDueDate] = useState(defaultDate ?? "");
  const [notes, setNotes] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [createdContact, setCreatedContact] = useState<{ id: string; name: string; mobile: string } | null>(null);
  const [busy, setBusy] = useState(false);

  const debouncedSearch = useDebounced(contactSearch, 300);
  const loadContacts = useCallback(
    () => listContacts({ page: 1, limit: 20, search: debouncedSearch.trim() || undefined }),
    [debouncedSearch],
  );
  const contacts = useResource(loadContacts, open && (Boolean(enquiry) || contactMode === "existing"), debouncedSearch);

  useEffect(() => {
    if (!open) return;
    setErrors({});
    setCreatedContact(null);
    setContactSearch("");
    if (enquiry) {
      setContactMode("existing");
      setContactId(enquiry.contactId);
      setTitle(enquiry.title);
      setSource(enquiry.source);
      setStatus(enquiry.status);
      setClosedReason(enquiry.closedReason ?? "");
      setDueDate(enquiry.dueDate ? toDateInputValue(new Date(enquiry.dueDate)) : "");
      setNotes(enquiry.notes ?? "");
      return;
    }
    setContactMode("new");
    setContactId("");
    setNewName("");
    setNewMobile("");
    setNewType("lead");
    setTitle("");
    setSource("");
    setStatus("new");
    setClosedReason("");
    setDueDate(defaultDate ?? "");
    setNotes("");
  }, [open, defaultDate, enquiry]);

  const sources = source && !ENQUIRY_SOURCES.includes(source as (typeof ENQUIRY_SOURCES)[number])
    ? [source, ...ENQUIRY_SOURCES]
    : [...ENQUIRY_SOURCES];

  const contactOptions = contacts.data?.items ?? [];
  const keepsCurrentContact = Boolean(contactId) && !contactOptions.some((contact) => contact.id === contactId);

  const onSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (busy) return;
    const creatingContact = !enquiry && contactMode === "new";
    const originalDue = enquiry?.dueDate ? toDateInputValue(new Date(enquiry.dueDate)) : "";
    const nextErrors: Record<string, string> = validateEnquiry({
      contactId: creatingContact ? "pending" : contactId,
      title,
      source,
      dueDate,
      notes,
      status,
      closedReason,
    });
    if (enquiry && dueDate && dueDate === originalDue) delete nextErrors.dueDate;
    if (creatingContact) {
      delete nextErrors.contactId;
      const dial = dialNumber(newMobile);
      const contactErrors = validateContact({
        name: newName,
        mobile: dial,
        email: "",
        companyName: "",
        notes: "",
      });
      if (contactErrors.name) nextErrors.newName = contactErrors.name;
      if (!DIAL_PATTERN.test(dial)) {
        nextErrors.newMobile = contactErrors.mobile ?? "Enter a mobile number of 7 to 15 digits";
      }
    }
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    setBusy(true);
    try {
      let resolvedContactId = contactId;
      if (creatingContact) {
        const dial = dialNumber(newMobile);
        const name = newName.trim();
        if (createdContact && createdContact.name === name && createdContact.mobile === dial) {
          resolvedContactId = createdContact.id;
        } else {
          const created = await createContact(
            toContactInput({ name: newName, mobile: dial, type: newType, email: "", companyName: "", notes: "" }),
          );
          resolvedContactId = created.id;
          setCreatedContact({ id: created.id, name, mobile: dial });
        }
      }

      const reason = status === "closed" ? closedReason.trim() : undefined;
      if (enquiry) {
        await updateEnquiry(enquiry.id, {
          contactId: resolvedContactId,
          title: title.trim(),
          source,
          status,
          notes: notes.trim() || null,
          ...(reason ? { closedReason: reason } : {}),
          ...(dueDate !== originalDue ? { dueDate: new Date(`${dueDate}T12:00:00`).toISOString() } : {}),
        });
        toast.success("Enquiry updated");
      } else {
        const created = await createEnquiry({
          contactId: resolvedContactId,
          title: title.trim(),
          source,
          status,
          dueDate: new Date(`${dueDate}T12:00:00`).toISOString(),
          notes: notes.trim() || null,
          ...(status === "closed" ? { closedReason: closedReason.trim() } : {}),
        });
        if (reason) await updateEnquiry(created.id, { status: "closed", closedReason: reason });
        toast.success("Enquiry created");
      }
      onOpenChange(false);
      onCreated();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to save enquiry");
    } finally {
      setBusy(false);
    }
  };

  const contactPicker = (
    <div className="space-y-2">
      <Input
        value={contactSearch}
        onChange={(event) => setContactSearch(event.target.value)}
        placeholder="Search name or mobile"
        aria-label="Search contacts"
        className="h-11 rounded-xl text-base"
      />
      <NativeSelect id="enquiry-contact" value={contactId} onChange={setContactId}>
        <option value="">{contacts.status === "loading" ? "Loading…" : "Select contact"}</option>
        {keepsCurrentContact ? <option value={contactId}>Current contact</option> : null}
        {contactOptions.map((contact) => (
          <option key={contact.id} value={contact.id}>
            {personLine(contact.name, contact.mobile)}
          </option>
        ))}
      </NativeSelect>
      <FieldError message={errors.contactId} />
    </div>
  );

  return (
    <FormSheet
      open={open}
      onOpenChange={onOpenChange}
      title={enquiry ? "Edit enquiry" : "Add enquiry"}
      description={enquiry ? "Update the case details." : "Contact, source, stage, and due date."}
      submitLabel={enquiry ? "Save" : "Create"}
      busy={busy}
      onSubmit={onSubmit}
    >
      {enquiry ? (
        <div className="space-y-2">
          <Label htmlFor="enquiry-contact">Contact</Label>
          {contactPicker}
        </div>
      ) : (
        <div className="space-y-2">
          <p className="text-sm font-medium">Contact</p>
          <div className="flex gap-2">
            <Button
              type="button"
              size="sm"
              variant={contactMode === "existing" ? "default" : "outline"}
              className="rounded-xl"
              aria-pressed={contactMode === "existing"}
              onClick={() => setContactMode("existing")}
            >
              Existing contact
            </Button>
            <Button
              type="button"
              size="sm"
              variant={contactMode === "new" ? "default" : "outline"}
              className="rounded-xl"
              aria-pressed={contactMode === "new"}
              onClick={() => setContactMode("new")}
            >
              + New contact
            </Button>
          </div>
          {contactMode === "existing" ? (
            <>
              <Label htmlFor="enquiry-contact" className="sr-only">
                Contact
              </Label>
              {contactPicker}
            </>
          ) : (
            <div className="space-y-3 rounded-xl border border-border p-3">
              <div className="space-y-2">
                <Label htmlFor="new-contact-name">Full name</Label>
                <Input
                  id="new-contact-name"
                  value={newName}
                  onChange={(event) => setNewName(event.target.value)}
                  placeholder="e.g. Priya Sharma"
                  className="h-11 rounded-xl text-base"
                />
                <FieldError message={errors.newName} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="new-contact-mobile">Mobile</Label>
                <Input
                  id="new-contact-mobile"
                  value={newMobile}
                  onChange={(event) => setNewMobile(event.target.value)}
                  placeholder="+91 98765 43210"
                  inputMode="tel"
                  className="h-11 rounded-xl text-base"
                />
                <FieldError message={errors.newMobile} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="new-contact-type">Contact type</Label>
                <NativeSelect id="new-contact-type" value={newType} onChange={(next) => setNewType(next as CrmContactType)}>
                  {CRM_CONTACT_TYPES.map((type) => (
                    <option key={type} value={type}>
                      {humanize(type)}
                    </option>
                  ))}
                </NativeSelect>
              </div>
            </div>
          )}
        </div>
      )}

      <div className="space-y-2">
        <Label htmlFor="enquiry-title">Title</Label>
        <Input
          id="enquiry-title"
          value={title}
          onChange={(event) => setTitle(event.target.value)}
          className="h-11 rounded-xl text-base"
        />
        <FieldError message={errors.title} />
      </div>
      <div className="space-y-2">
        <Label htmlFor="enquiry-source">How did they find us?</Label>
        <NativeSelect id="enquiry-source" value={source} onChange={setSource}>
          <option value="">Select source</option>
          {sources.map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </NativeSelect>
        <FieldError message={errors.source} />
      </div>
      <div className="space-y-2">
        <Label htmlFor="enquiry-status">Stage</Label>
        <NativeSelect id="enquiry-status" value={status} onChange={(next) => setStatus(next as CrmEnquiryStatus)}>
          {CRM_ENQUIRY_STATUSES.map((option) => (
            <option key={option} value={option}>
              {humanize(option)}
            </option>
          ))}
        </NativeSelect>
      </div>
      {status === "closed" ? (
        <div className="space-y-2">
          <Label htmlFor="enquiry-close-reason">Close reason</Label>
          <Input
            id="enquiry-close-reason"
            value={closedReason}
            onChange={(event) => setClosedReason(event.target.value)}
            maxLength={200}
            className="h-11 rounded-xl text-base"
          />
          <FieldError message={errors.closedReason} />
        </div>
      ) : null}
      <div className="space-y-2">
        <Label id="enquiry-due-label">Due date</Label>
        <DueDatePicker id="enquiry-due" labelledBy="enquiry-due-label" value={dueDate} onChange={setDueDate} />
        <FieldError message={errors.dueDate} />
      </div>
      <div className="space-y-2">
        <Label htmlFor="enquiry-notes">Notes</Label>
        <Textarea
          id="enquiry-notes"
          value={notes}
          onChange={(event) => setNotes(event.target.value)}
          className="rounded-xl text-base"
          rows={3}
        />
        <FieldError message={errors.notes} />
      </div>
    </FormSheet>
  );
}
