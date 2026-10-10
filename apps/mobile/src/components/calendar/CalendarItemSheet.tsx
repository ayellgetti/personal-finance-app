import { FormEvent, useEffect, useState } from "react";
import { toast } from "sonner";
import { ConfirmInline } from "@/components/ConfirmInline";
import { FieldError } from "@/components/forms/NativeSelect";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Textarea } from "@/components/ui/textarea";
import { KIND_LABELS } from "@/lib/mobile/calendar";
import { isoToLocalInput, localInputToIso } from "@/lib/mobile/booking";
import { formatDateTime } from "@/lib/mobile/format";
import { removeCalendarEvent, updateCalendarEvent } from "@/lib/mobile/remote";
import { optionalTrimmed, toReminderInput, trimmed, validateReminder } from "@/lib/mobile/validate";
import type { CrmCalendarItem } from "@/types/crm";

function isReminder(item: CrmCalendarItem): boolean {
  if (item.kind === "event") return true;
  return item.kind !== "task" && item.kind !== "followup" && item.kind !== "booking" && !item.enquiryId && Boolean(item.notes?.trim());
}

function isBooking(item: CrmCalendarItem): boolean {
  return item.kind === "booking";
}

function canEditItem(item: CrmCalendarItem): boolean {
  return Boolean(item.id) && (isReminder(item) || isBooking(item));
}

/** Detail for a calendar row, with edit and remove for reminders and bookings. */
export function CalendarItemSheet({
  item,
  onClose,
  onRemind,
  onFollow,
  onOpenRecord,
  canUpdate = false,
  canDelete = false,
  onChanged,
}: {
  item: CrmCalendarItem | null;
  onClose: () => void;
  onRemind?: (item: CrmCalendarItem) => void;
  onFollow?: (item: CrmCalendarItem) => void;
  onOpenRecord?: (item: CrmCalendarItem) => void;
  canUpdate?: boolean;
  canDelete?: boolean;
  onChanged?: () => void;
}) {
  const [editing, setEditing] = useState(false);
  const [confirmRemove, setConfirmRemove] = useState(false);
  const [title, setTitle] = useState("");
  const [starts, setStarts] = useState("");
  const [ends, setEnds] = useState("");
  const [notes, setNotes] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!item) return;
    setEditing(false);
    setConfirmRemove(false);
    setTitle(item.title);
    setStarts(isoToLocalInput(item.at));
    setEnds(item.endsAt ? isoToLocalInput(item.endsAt) : "");
    setNotes(item.notes ?? "");
    setErrors({});
    setBusy(false);
  }, [item]);

  const mutable = item ? canEditItem(item) : false;
  const booking = item ? isBooking(item) : false;
  const showRecord = Boolean(item && onOpenRecord && (item.kind === "booking" || item.enquiryId));

  const save = async (event: FormEvent) => {
    event.preventDefault();
    if (!item || !mutable) return;
    if (booking) {
      const nextErrors: Record<string, string> = {};
      const nextTitle = trimmed(title);
      if (!nextTitle || nextTitle.length > 160) nextErrors.title = "Title is required (160 characters max)";
      if (!starts || Number.isNaN(new Date(starts).getTime())) nextErrors.startsAt = "Start time is required";
      if (!ends || Number.isNaN(new Date(ends).getTime())) nextErrors.endsAt = "End time is required";
      else if (starts && new Date(ends).getTime() <= new Date(starts).getTime()) {
        nextErrors.endsAt = "End time must be after the start";
      }
      if (notes.trim().length > 4000) nextErrors.notes = "Notes are too long";
      setErrors(nextErrors);
      if (Object.keys(nextErrors).length > 0) return;
      setBusy(true);
      try {
        await updateCalendarEvent(item.id, {
          title: nextTitle,
          startsAt: localInputToIso(starts),
          endsAt: localInputToIso(ends),
          notes: optionalTrimmed(notes),
        });
        toast.success("Booking updated");
        onChanged?.();
        onClose();
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Unable to update booking");
      } finally {
        setBusy(false);
      }
      return;
    }

    const nextErrors = validateReminder({ title, remindAt: starts, notes });
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;
    setBusy(true);
    try {
      const input = toReminderInput({ title, remindAt: starts, notes });
      await updateCalendarEvent(item.id, {
        title: input.title,
        startsAt: input.startsAt,
        endsAt: input.endsAt,
        notes: input.notes,
      });
      toast.success("Reminder updated");
      onChanged?.();
      onClose();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to update reminder");
    } finally {
      setBusy(false);
    }
  };

  const remove = async () => {
    if (!item || !mutable) return;
    setBusy(true);
    try {
      await removeCalendarEvent(item.id);
      toast.success(booking ? "Booking removed" : "Reminder removed");
      setConfirmRemove(false);
      onChanged?.();
      onClose();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to remove this item");
    } finally {
      setBusy(false);
    }
  };

  return (
    <Sheet open={Boolean(item)} onOpenChange={(next) => { if (!next && !busy) onClose(); }}>
      <SheetContent side="bottom" className="max-h-[92vh] overflow-y-auto rounded-t-3xl pb-safe">
        {item ? (
          <div className="mx-auto w-full max-w-tablet space-y-4 pb-4">
            <SheetHeader className="text-left">
              <div className="flex items-start justify-between gap-3 pr-8">
                <div className="min-w-0 space-y-1">
                  <SheetTitle className="font-display text-lg">{item.title}</SheetTitle>
                  <SheetDescription>{formatDateTime(item.at)}</SheetDescription>
                </div>
                <Badge variant="secondary" className="shrink-0 rounded-full">
                  {KIND_LABELS[item.kind]}
                </Badge>
              </div>
            </SheetHeader>
            {editing ? (
              <form onSubmit={(event) => void save(event)} className="space-y-3">
                <div className="space-y-2">
                  <Label htmlFor="calendar-item-title">Title</Label>
                  <Input
                    id="calendar-item-title"
                    value={title}
                    onChange={(event) => setTitle(event.target.value)}
                    className="h-11 rounded-xl text-base"
                    aria-invalid={Boolean(errors.title)}
                  />
                  <FieldError message={errors.title} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="calendar-item-starts">{booking ? "Starts" : "Date and time"}</Label>
                  <Input
                    id="calendar-item-starts"
                    type="datetime-local"
                    value={starts}
                    onChange={(event) => setStarts(event.target.value)}
                    className="h-11 rounded-xl text-base"
                    aria-invalid={Boolean(errors.startsAt || errors.remindAt)}
                  />
                  <FieldError message={errors.startsAt ?? errors.remindAt} />
                </div>
                {booking ? (
                  <div className="space-y-2">
                    <Label htmlFor="calendar-item-ends">Ends</Label>
                    <Input
                      id="calendar-item-ends"
                      type="datetime-local"
                      value={ends}
                      onChange={(event) => setEnds(event.target.value)}
                      className="h-11 rounded-xl text-base"
                      aria-invalid={Boolean(errors.endsAt)}
                    />
                    <FieldError message={errors.endsAt} />
                  </div>
                ) : null}
                <div className="space-y-2">
                  <Label htmlFor="calendar-item-notes">Notes</Label>
                  <Textarea
                    id="calendar-item-notes"
                    value={notes}
                    onChange={(event) => setNotes(event.target.value)}
                    className="rounded-xl text-base"
                    rows={3}
                  />
                  <FieldError message={errors.notes} />
                </div>
                <div className="flex gap-2">
                  <Button type="button" variant="outline" className="h-11 flex-1 rounded-xl" disabled={busy} onClick={() => setEditing(false)}>
                    Cancel
                  </Button>
                  <Button type="submit" className="h-11 flex-1 rounded-xl" disabled={busy}>
                    Save
                  </Button>
                </div>
              </form>
            ) : (
              <dl className="grid grid-cols-2 gap-x-4 gap-y-3">
                <div>
                  <dt className="text-xs text-muted-foreground">Starts</dt>
                  <dd className="mt-0.5 text-sm font-medium">{formatDateTime(item.at)}</dd>
                </div>
                <div>
                  <dt className="text-xs text-muted-foreground">Ends</dt>
                  <dd className="mt-0.5 text-sm font-medium">{item.endsAt ? formatDateTime(item.endsAt) : "—"}</dd>
                </div>
                {item.notes ? (
                  <div className="col-span-2">
                    <dt className="text-xs text-muted-foreground">Notes</dt>
                    <dd className="mt-0.5 whitespace-pre-wrap text-sm font-medium">{item.notes}</dd>
                  </div>
                ) : null}
              </dl>
            )}
            {confirmRemove ? (
              <ConfirmInline
                message={
                  booking
                    ? "Remove this booking? The linked enquiry is removed with it. A booking that already has a paid payment cannot be removed."
                    : "Remove this reminder?"
                }
                busy={busy}
                onCancel={() => setConfirmRemove(false)}
                onConfirm={() => void remove()}
              />
            ) : null}
            {!editing && !confirmRemove && (canUpdate || canDelete || onRemind || (onFollow && item.enquiryId) || showRecord) ? (
              <div className="flex flex-wrap gap-2">
                {canUpdate && mutable ? (
                  <Button type="button" size="sm" variant="outline" className="rounded-xl" onClick={() => setEditing(true)}>
                    Edit
                  </Button>
                ) : null}
                {canDelete && mutable ? (
                  <Button type="button" size="sm" variant="outline" className="rounded-xl text-destructive" onClick={() => setConfirmRemove(true)}>
                    Remove
                  </Button>
                ) : null}
                {showRecord && onOpenRecord ? (
                  <Button type="button" size="sm" variant="outline" className="rounded-xl" onClick={() => onOpenRecord(item)}>
                    {item.kind === "booking" ? "View booking" : "Open lead"}
                  </Button>
                ) : null}
                {onRemind ? (
                  <Button type="button" size="sm" variant="outline" className="rounded-xl" onClick={() => onRemind(item)}>
                    Add reminder
                  </Button>
                ) : null}
                {onFollow && item.enquiryId ? (
                  <Button type="button" size="sm" variant="outline" className="rounded-xl" onClick={() => onFollow(item)}>
                    Add follow-up
                  </Button>
                ) : null}
              </div>
            ) : null}
          </div>
        ) : null}
      </SheetContent>
    </Sheet>
  );
}
