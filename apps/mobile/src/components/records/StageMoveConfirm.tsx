import { useState } from "react";
import { FieldError } from "@/components/forms/NativeSelect";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { applyBookingSlot, applyBookingStart, toBookingInput, validateBooking, type BookingFormState } from "@/lib/mobile/booking";
import { humanize } from "@/lib/mobile/format";
import { CRM_EVENT_SLOTS, type ConvertEnquiryInput, type CrmEnquiry, type CrmEnquiryStatus, type CrmEventSlot } from "@/types/crm";

const SLOT_LABELS: Record<CrmEventSlot, string> = {
  morning: "Morning",
  evening: "Evening",
  full_day: "Full day",
};

type ClosedMode = "booked" | "lost";

const EMPTY_BOOKING: BookingFormState = { startsAt: "", endsAt: "", slot: "" };

export function StageMoveConfirm({
  enquiry,
  stage,
  canConvert,
  busy,
  onCancel,
  onConfirm,
}: {
  enquiry: CrmEnquiry;
  stage: CrmEnquiryStatus;
  canConvert: boolean;
  busy: boolean;
  onCancel: () => void;
  onConfirm: (result: { closedReason?: string; booking?: ConvertEnquiryInput }) => void;
}) {
  const closing = stage === "closed";
  const [mode, setMode] = useState<ClosedMode>("booked");
  const [lostText, setLostText] = useState("");
  const [booking, setBooking] = useState<BookingFormState>(EMPTY_BOOKING);
  const [bookingErrors, setBookingErrors] = useState<Record<string, string>>({});
  const bookedConvert = closing && mode === "booked" && canConvert;
  const lostReady = mode === "lost" && lostText.trim().length > 0;
  const canSubmit = !closing || mode === "booked" || lostReady;

  const submit = () => {
    if (bookedConvert) {
      const nextErrors = validateBooking(booking);
      setBookingErrors(nextErrors);
      if (Object.keys(nextErrors).length > 0) return;
      onConfirm({ closedReason: "Booked", booking: toBookingInput(booking) });
      return;
    }
    if (!closing) {
      onConfirm({});
      return;
    }
    onConfirm({ closedReason: mode === "booked" ? "Booked" : `Lost: ${lostText.trim()}` });
  };

  const confirmLabel = closing ? (bookedConvert ? "Convert to booked" : "Close enquiry") : "Move";

  return (
    <div role="alertdialog" aria-label="Confirm stage move" className="space-y-3 rounded-2xl border border-border bg-card p-3">
      <p className="text-sm">
        Move “{enquiry.title}” from {humanize(enquiry.status)} to <span className="font-semibold">{humanize(stage)}</span>?
        {closing ? " Closing is final." : ""}
      </p>
      {closing ? (
        <div className="space-y-2">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Close reason</p>
          <div className="grid grid-cols-2 gap-2">
            <Button type="button" variant={mode === "booked" ? "default" : "outline"} className="h-11 rounded-xl" onClick={() => setMode("booked")}>
              Booked
            </Button>
            <Button type="button" variant={mode === "lost" ? "default" : "outline"} className="h-11 rounded-xl" onClick={() => setMode("lost")}>
              Lost
            </Button>
          </div>
          {mode === "lost" ? (
            <div className="space-y-1">
              <Label htmlFor="move-lost-reason">Why it was lost</Label>
              <Input
                id="move-lost-reason"
                value={lostText}
                maxLength={180}
                onChange={(event) => setLostText(event.target.value)}
                placeholder="Price, date, or another venue"
                className="h-11 rounded-xl text-base"
              />
            </div>
          ) : (
            <p className="text-xs text-muted-foreground">
              {canConvert ? "Add the event so this close becomes a booking." : "The enquiry closes as Booked without creating a booking."}
            </p>
          )}
        </div>
      ) : null}
      {bookedConvert ? (
        <div className="space-y-3">
          <div className="space-y-1">
            <Label htmlFor="move-start">Event start</Label>
            <Input
              id="move-start"
              type="datetime-local"
              value={booking.startsAt}
              onChange={(event) => setBooking((current) => applyBookingStart(current, event.target.value))}
              className="h-11 rounded-xl text-base"
            />
            <FieldError message={bookingErrors.startsAt} />
          </div>
          <div className="space-y-1">
            <Label htmlFor="move-end">Event end</Label>
            <Input
              id="move-end"
              type="datetime-local"
              value={booking.endsAt}
              onChange={(event) => setBooking((current) => ({ ...current, endsAt: event.target.value }))}
              className="h-11 rounded-xl text-base"
            />
            <FieldError message={bookingErrors.endsAt} />
          </div>
          <div className="space-y-1">
            <Label htmlFor="move-slot">Slot</Label>
            <Select
              value={booking.slot || "none"}
              onValueChange={(next) => {
                const picked = next === "none" ? "" : (next as CrmEventSlot);
                setBooking((current) => applyBookingSlot(current, picked));
              }}
            >
              <SelectTrigger id="move-slot" className="h-11 rounded-xl">
                <SelectValue placeholder="Optional slot" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">No slot</SelectItem>
                {CRM_EVENT_SLOTS.map((slot) => (
                  <SelectItem key={slot} value={slot}>
                    {SLOT_LABELS[slot]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <FieldError message={bookingErrors.slot} />
          </div>
        </div>
      ) : null}
      <div className="flex gap-2">
        <Button type="button" variant="outline" className="rounded-xl" disabled={busy} onClick={onCancel}>
          Cancel
        </Button>
        <Button type="button" className="rounded-xl" disabled={busy || !canSubmit} onClick={submit}>
          {confirmLabel}
        </Button>
      </div>
    </div>
  );
}
