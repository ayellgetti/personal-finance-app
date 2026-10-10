import { FormEvent, useEffect, useState } from "react";
import { toast } from "sonner";
import { FormSheet } from "@/components/forms/FormSheet";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { createCalendarEvent } from "@/lib/mobile/remote";
import { toReminderInput, validateReminder } from "@/lib/mobile/validate";

export type ReminderTarget = {
  label: string;
  contactId: string | null;
  enquiryId: string | null;
};

function toDateTimeLocal(date: Date): string {
  const pad = (value: number) => String(value).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

function nextHour(now = new Date()): string {
  const next = new Date(now);
  next.setMinutes(0, 0, 0);
  next.setHours(next.getHours() + 1);
  return toDateTimeLocal(next);
}

export function QuickReminderSheet({
  target,
  onOpenChange,
  onCreated,
}: {
  target: ReminderTarget | null;
  onOpenChange: (next: boolean) => void;
  onCreated: () => void;
}) {
  const [title, setTitle] = useState("");
  const [remindAt, setRemindAt] = useState(() => nextHour());
  const [notes, setNotes] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);
  const [shown, setShown] = useState(target);

  useEffect(() => {
    if (!target) return;
    setShown(target);
    setTitle("");
    setRemindAt(nextHour());
    setNotes("");
    setErrors({});
  }, [target]);

  const onSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (!target) return;
    const nextErrors = validateReminder({ title, remindAt, notes });
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) {
      toast.error(nextErrors.title ?? nextErrors.remindAt ?? "Check the reminder");
      return;
    }
    setBusy(true);
    try {
      await createCalendarEvent(
        toReminderInput({
          title,
          remindAt,
          notes,
          contactId: target.contactId,
          enquiryId: target.enquiryId,
        }),
      );
      toast.success("Reminder created");
      onOpenChange(false);
      onCreated();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to create reminder");
    } finally {
      setBusy(false);
    }
  };

  return (
    <FormSheet
      open={Boolean(target)}
      onOpenChange={onOpenChange}
      title="Add reminder"
      description={shown ? `Reminder for ${shown.label}` : "Add a reminder for this person."}
      submitLabel="Add reminder"
      busy={busy}
      onSubmit={onSubmit}
    >
      <div className="space-y-2">
        <Label htmlFor="quick-reminder-title">Title</Label>
        <Input
          id="quick-reminder-title"
          value={title}
          onChange={(event) => setTitle(event.target.value)}
          className="h-11 rounded-xl text-base"
          required
        />
        {errors.title ? <p className="text-xs text-destructive">{errors.title}</p> : null}
      </div>
      <div className="space-y-2">
        <Label htmlFor="quick-reminder-at">Date and time</Label>
        <Input
          id="quick-reminder-at"
          type="datetime-local"
          value={remindAt}
          onChange={(event) => setRemindAt(event.target.value)}
          className="h-11 rounded-xl text-base"
          required
        />
        {errors.remindAt ? <p className="text-xs text-destructive">{errors.remindAt}</p> : null}
      </div>
      <div className="space-y-2">
        <Label htmlFor="quick-reminder-notes">Notes</Label>
        <Textarea
          id="quick-reminder-notes"
          value={notes}
          onChange={(event) => setNotes(event.target.value)}
          className="rounded-xl text-base"
          rows={3}
        />
      </div>
    </FormSheet>
  );
}
