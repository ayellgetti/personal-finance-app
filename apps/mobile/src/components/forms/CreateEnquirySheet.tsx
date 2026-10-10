import { FormEvent, useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { DueDatePicker } from "@/components/forms/DueDatePicker";
import { FormSheet } from "@/components/forms/FormSheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { dayKey } from "@/lib/mobile/calendar";
import { humanize, toDateInputValue } from "@/lib/mobile/format";
import { createContact, createEnquiry, listContacts, updateEnquiry } from "@/lib/mobile/remote";
import { useResource } from "@/lib/mobile/use-resource";
import { cn } from "@/lib/utils";
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
  const [newName, setNewName] = useState("");
  const [newMobile, setNewMobile] = useState("");
  const [newType, setNewType] = useState<CrmContactType>("lead");
  const [title, setTitle] = useState("");
  const [source, setSource] = useState("");
  const [status, setStatus] = useState<CrmEnquiryStatus>("new");
  const [dueDate, setDueDate] = useState(defaultDate ?? "");
  const [notes, setNotes] = useState("");
  const [busy, setBusy] = useState(false);

  const loadContacts = useCallback(() => listContacts({ page: 1, limit: 100 }), []);
  const contacts = useResource(loadContacts, open && (Boolean(enquiry) || contactMode === "existing"));

  useEffect(() => {
    if (!open) return;
    if (enquiry) {
      setContactMode("existing");
      setContactId(enquiry.contactId);
      setTitle(enquiry.title);
      setSource(enquiry.source);
      setStatus(enquiry.status);
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
    setDueDate(defaultDate ?? "");
    setNotes("");
  }, [open, defaultDate, enquiry]);

  const sources = source && !ENQUIRY_SOURCES.includes(source as (typeof ENQUIRY_SOURCES)[number])
    ? [source, ...ENQUIRY_SOURCES]
    : [...ENQUIRY_SOURCES];

  const onSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (!enquiry && contactMode === "new") {
      if (!newName.trim()) {
        toast.error("Name is required");
        return;
      }
      if (!dialNumber(newMobile)) {
        toast.error("Mobile is required");
        return;
      }
    } else if (!contactId) {
      toast.error("Select an existing contact");
      return;
    }
    if (!title.trim()) {
      toast.error("Title is required");
      return;
    }
    if (!source) {
      toast.error("Source is required");
      return;
    }
    if (!dueDate) {
      toast.error("Due date is required");
      return;
    }
    const originalDue = enquiry?.dueDate ? toDateInputValue(new Date(enquiry.dueDate)) : "";
    if (dueDate < dayKey(new Date()) && dueDate !== originalDue) {
      toast.error("Due date must be today or in the future");
      return;
    }

    setBusy(true);
    try {
      let resolvedContactId = contactId;
      if (!enquiry && contactMode === "new") {
        const created = await createContact({
          name: newName.trim(),
          mobile: dialNumber(newMobile),
          type: newType,
        });
        resolvedContactId = created.id;
      }

      if (enquiry) {
        await updateEnquiry(enquiry.id, {
          contactId: resolvedContactId,
          title: title.trim(),
          source,
          status,
          notes: notes.trim() || null,
          ...(dueDate !== originalDue ? { dueDate: new Date(`${dueDate}T12:00:00`).toISOString() } : {}),
        });
        toast.success("Enquiry updated");
      } else {
        await createEnquiry({
          contactId: resolvedContactId,
          title: title.trim(),
          source,
          status,
          dueDate: new Date(`${dueDate}T12:00:00`).toISOString(),
          notes: notes.trim() || null,
        });
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
          <Select value={contactId} onValueChange={setContactId}>
            <SelectTrigger id="enquiry-contact" className="h-11 rounded-xl">
              <SelectValue placeholder={contacts.status === "loading" ? "Loading…" : "Select contact"} />
            </SelectTrigger>
            <SelectContent className="max-h-72">
              {(contacts.data?.items ?? []).map((contact) => (
                <SelectItem key={contact.id} value={contact.id}>
                  {contact.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
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
              onClick={() => setContactMode("existing")}
            >
              Existing contact
            </Button>
            <Button
              type="button"
              size="sm"
              variant={contactMode === "new" ? "default" : "outline"}
              className={cn("rounded-xl", contactMode === "new" && "bg-primary")}
              onClick={() => setContactMode("new")}
            >
              + New contact
            </Button>
          </div>
          {contactMode === "existing" ? (
            <Select value={contactId} onValueChange={setContactId}>
              <SelectTrigger id="enquiry-contact" className="h-11 rounded-xl" aria-label="Contact">
                <SelectValue placeholder={contacts.status === "loading" ? "Loading…" : "Select contact"} />
              </SelectTrigger>
              <SelectContent className="max-h-72">
                {(contacts.data?.items ?? []).map((contact) => (
                  <SelectItem key={contact.id} value={contact.id}>
                    {contact.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
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
              </div>
              <div className="space-y-2">
                <Label htmlFor="new-contact-type">Contact type</Label>
                <Select value={newType} onValueChange={(next) => setNewType(next as CrmContactType)}>
                  <SelectTrigger id="new-contact-type" className="h-11 rounded-xl">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {CRM_CONTACT_TYPES.map((type) => (
                      <SelectItem key={type} value={type}>
                        {humanize(type)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
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
      </div>
      <div className="space-y-2">
        <Label htmlFor="enquiry-source">How did they find us?</Label>
        <Select value={source} onValueChange={setSource}>
          <SelectTrigger id="enquiry-source" className="h-11 rounded-xl">
            <SelectValue placeholder="Select source" />
          </SelectTrigger>
          <SelectContent>
            {sources.map((option) => (
              <SelectItem key={option} value={option}>
                {option}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-2">
        <Label htmlFor="enquiry-status">Stage</Label>
        <Select value={status} onValueChange={(next) => setStatus(next as CrmEnquiryStatus)}>
          <SelectTrigger id="enquiry-status" className="h-11 rounded-xl">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {CRM_ENQUIRY_STATUSES.map((option) => (
              <SelectItem key={option} value={option}>
                {humanize(option)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-2">
        <Label id="enquiry-due-label">Due date</Label>
        <DueDatePicker
          id="enquiry-due"
          labelledBy="enquiry-due-label"
          value={dueDate}
          onChange={setDueDate}
        />
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
      </div>
    </FormSheet>
  );
}
