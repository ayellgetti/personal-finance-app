import { FormEvent, useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { FieldError, NativeSelect } from "@/components/forms/NativeSelect";
import { FormSheet } from "@/components/forms/FormSheet";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { isoToLocalInput } from "@/lib/mobile/booking";
import { personLine } from "@/lib/mobile/format";
import { createCalendarEvent, listContacts, updateCalendarEvent } from "@/lib/mobile/remote";
import { useDebounced } from "@/lib/mobile/use-debounced";
import { useResource } from "@/lib/mobile/use-resource";
import { toReminderInput, validateReminder } from "@/lib/mobile/validate";

export type EditableReminder = {
  id: string;
  title: string;
  startsAt: string;
  notes: string | null;
  contactId: string | null;
};

function nextHourLocal(): string {
  const next = new Date();
  next.setMinutes(0, 0, 0);
  next.setHours(next.getHours() + 1);
  return isoToLocalInput(next.toISOString());
}

/** Standalone reminders are calendar events with no enquiry; booking events stay on the Booked flow. */
export function ReminderSheet({
  open,
  onOpenChange,
  onSaved,
  reminder = null,
  canPickContact,
}: {
  open: boolean;
  onOpenChange: (next: boolean) => void;
  onSaved: () => void;
  reminder?: EditableReminder | null;
  canPickContact: boolean;
}) {
  const [title, setTitle] = useState("");
  const [remindAt, setRemindAt] = useState("");
  const [notes, setNotes] = useState("");
  const [contactId, setContactId] = useState("");
  const [contactQuery, setContactQuery] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);
  const search = useDebounced(contactQuery, 300);

  const loadContacts = useCallback(() => listContacts({ page: 1, limit: 20, search: search || undefined }), [search]);
  const contacts = useResource(loadContacts, open && canPickContact, search);

  useEffect(() => {
    if (!open) return;
    setErrors({});
    setContactQuery("");
    setTitle(reminder?.title ?? "");
    setRemindAt(reminder ? isoToLocalInput(reminder.startsAt) : nextHourLocal());
    setNotes(reminder?.notes ?? "");
    setContactId(reminder?.contactId ?? "");
  }, [open, reminder]);

  const onSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (busy) return;
    const nextErrors = validateReminder({ title, remindAt, notes });
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) {
      toast.error(nextErrors.title ?? nextErrors.remindAt ?? "Check the reminder");
      return;
    }
    const input = toReminderInput({ title, remindAt, notes, contactId, enquiryId: null });
    setBusy(true);
    try {
      if (reminder) await updateCalendarEvent(reminder.id, input);
      else await createCalendarEvent(input);
      toast.success(reminder ? "Reminder updated" : "Reminder created");
      onOpenChange(false);
      onSaved();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to save reminder");
    } finally {
      setBusy(false);
    }
  };

  const contactOptions = contacts.data?.items ?? [];
  const selectedMissing = contactId && !contactOptions.some((contact) => contact.id === contactId);

  return (
    <FormSheet
      open={open}
      onOpenChange={onOpenChange}
      title={reminder ? "Edit reminder" : "New reminder"}
      description="A reminder blocks 30 minutes on the calendar."
      submitLabel={reminder ? "Save reminder" : "Create reminder"}
      busy={busy}
      onSubmit={onSubmit}
    >
      <div className="space-y-2">
        <Label htmlFor="reminder-title">Title</Label>
        <Input id="reminder-title" value={title} onChange={(e) => setTitle(e.target.value)} className="h-11 rounded-xl text-base" />
        <FieldError message={errors.title} />
      </div>
      <div className="space-y-2">
        <Label htmlFor="reminder-at">Date and time</Label>
        <Input
          id="reminder-at"
          type="datetime-local"
          value={remindAt}
          onChange={(e) => setRemindAt(e.target.value)}
          className="h-11 rounded-xl text-base"
        />
        <FieldError message={errors.remindAt} />
      </div>
      {canPickContact ? (
        <div className="space-y-2">
          <Label htmlFor="reminder-contact-search">Find contact</Label>
          <Input
            id="reminder-contact-search"
            value={contactQuery}
            onChange={(e) => setContactQuery(e.target.value)}
            placeholder="Search by name or mobile"
            className="h-11 rounded-xl text-base"
          />
          <Label htmlFor="reminder-contact" className="sr-only">
            Contact
          </Label>
          <NativeSelect id="reminder-contact" value={contactId} onChange={setContactId}>
            <option value="">No contact</option>
            {selectedMissing ? <option value={contactId}>Current contact</option> : null}
            {contactOptions.map((contact) => (
              <option key={contact.id} value={contact.id}>
                {personLine(contact.name, contact.mobile)}
              </option>
            ))}
          </NativeSelect>
        </div>
      ) : null}
      <div className="space-y-2">
        <Label htmlFor="reminder-notes">Notes</Label>
        <Textarea id="reminder-notes" value={notes} onChange={(e) => setNotes(e.target.value)} className="rounded-xl text-base" rows={3} />
        <FieldError message={errors.notes} />
      </div>
    </FormSheet>
  );
}
