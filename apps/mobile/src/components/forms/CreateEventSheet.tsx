import { FormEvent, useEffect, useState } from "react";
import { toast } from "sonner";
import { FormSheet } from "@/components/forms/FormSheet";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toDateInputValue } from "@/lib/mobile/format";
import { createCalendarEvent } from "@/lib/mobile/remote";

export function CreateEventSheet({
  open,
  onOpenChange,
  day,
  onCreated,
}: {
  open: boolean;
  onOpenChange: (next: boolean) => void;
  day: Date;
  onCreated: () => void;
}) {
  const [title, setTitle] = useState("");
  const [date, setDate] = useState(() => toDateInputValue(day));
  const [startTime, setStartTime] = useState("10:00");
  const [endTime, setEndTime] = useState("11:00");
  const [notes, setNotes] = useState("");
  const [busy, setBusy] = useState(false);

  // Reopening on a different day should land on that day, not the previous one.
  useEffect(() => {
    if (open) setDate(toDateInputValue(day));
  }, [open, day]);

  const onSubmit = async (event: FormEvent) => {
    event.preventDefault();
    const startsAt = new Date(`${date}T${startTime}`);
    const endsAt = new Date(`${date}T${endTime}`);
    if (endsAt <= startsAt) {
      toast.error("End time must be after the start time");
      return;
    }

    setBusy(true);
    try {
      await createCalendarEvent({
        title,
        startsAt: startsAt.toISOString(),
        endsAt: endsAt.toISOString(),
        notes: notes || null,
      });
      toast.success("Reminder created");
      setTitle("");
      setNotes("");
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
      open={open}
      onOpenChange={onOpenChange}
      title="New reminder"
      description="Block a slot on the shared calendar."
      submitLabel="Create reminder"
      busy={busy}
      onSubmit={onSubmit}
    >
      <div className="space-y-2">
        <Label htmlFor="event-title">Title</Label>
        <Input
          id="event-title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="h-11 rounded-xl text-base"
          required
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="event-date">Date</Label>
        <Input
          id="event-date"
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          className="h-11 rounded-xl text-base"
          required
        />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-2">
          <Label htmlFor="event-start">Starts</Label>
          <Input
            id="event-start"
            type="time"
            value={startTime}
            onChange={(e) => setStartTime(e.target.value)}
            className="h-11 rounded-xl text-base"
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="event-end">Ends</Label>
          <Input
            id="event-end"
            type="time"
            value={endTime}
            onChange={(e) => setEndTime(e.target.value)}
            className="h-11 rounded-xl text-base"
            required
          />
        </div>
      </div>
      <div className="space-y-2">
        <Label htmlFor="event-notes">Notes</Label>
        <Textarea
          id="event-notes"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          className="rounded-xl text-base"
          rows={3}
        />
      </div>
    </FormSheet>
  );
}
