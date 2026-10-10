import { FormEvent, useEffect, useState } from "react";
import { toast } from "sonner";
import { FormSheet } from "@/components/forms/FormSheet";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { applyBookingSlot, applyBookingStart, toBookingInput, validateBooking } from "@/lib/mobile/booking";
import { convertEnquiry } from "@/lib/mobile/remote";
import { CRM_EVENT_SLOTS, type CrmEnquiry, type CrmEventSlot } from "@/types/crm";

const SLOT_LABELS: Record<CrmEventSlot, string> = {
  morning: "Morning",
  evening: "Evening",
  full_day: "Full day",
};

export function ConvertEnquirySheet({
  enquiry,
  onOpenChange,
  onConverted,
}: {
  enquiry: CrmEnquiry | null;
  onOpenChange: (next: boolean) => void;
  onConverted: () => void;
}) {
  const [billingName, setBillingName] = useState("");
  const [startsAt, setStartsAt] = useState("");
  const [endsAt, setEndsAt] = useState("");
  const [slot, setSlot] = useState<CrmEventSlot | "">("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    setBillingName("");
    setStartsAt("");
    setEndsAt("");
    setSlot("");
    setErrors({});
  }, [enquiry?.id]);

  const onSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (!enquiry) return;
    const form = { startsAt, endsAt, slot };
    const nextErrors = validateBooking(form);
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) {
      toast.error(nextErrors.startsAt ?? nextErrors.endsAt ?? "Check the booking");
      return;
    }
    setBusy(true);
    try {
      await convertEnquiry(enquiry.id, toBookingInput(form, billingName));
      toast.success("Converted to booked");
      onOpenChange(false);
      onConverted();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to convert enquiry");
    } finally {
      setBusy(false);
    }
  };

  return (
    <FormSheet
      open={Boolean(enquiry)}
      onOpenChange={onOpenChange}
      title="Convert to booked"
      description={enquiry ? enquiry.title : "Create the booking."}
      submitLabel="Convert to booked"
      busy={busy}
      onSubmit={onSubmit}
    >
      <div className="space-y-2">
        <Label htmlFor="convert-billing">Billing name</Label>
        <Input
          id="convert-billing"
          value={billingName}
          onChange={(event) => setBillingName(event.target.value)}
          placeholder="Defaults to the contact name"
          className="h-11 rounded-xl text-base"
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="convert-start">Event start</Label>
        <Input
          id="convert-start"
          type="datetime-local"
          value={startsAt}
          onChange={(event) => {
            const next = applyBookingStart({ startsAt, endsAt, slot }, event.target.value);
            setStartsAt(next.startsAt);
            setEndsAt(next.endsAt);
          }}
          className="h-11 rounded-xl text-base"
          required
        />
        {errors.startsAt ? <p className="text-xs text-destructive">{errors.startsAt}</p> : null}
      </div>
      <div className="space-y-2">
        <Label htmlFor="convert-end">Event end</Label>
        <Input
          id="convert-end"
          type="datetime-local"
          value={endsAt}
          onChange={(event) => setEndsAt(event.target.value)}
          className="h-11 rounded-xl text-base"
        />
        {errors.endsAt ? <p className="text-xs text-destructive">{errors.endsAt}</p> : null}
      </div>
      <div className="space-y-2">
        <Label htmlFor="convert-slot">Slot</Label>
        <Select
          value={slot || "none"}
          onValueChange={(next) => {
            const picked = next === "none" ? "" : (next as CrmEventSlot);
            const updated = applyBookingSlot({ startsAt, endsAt, slot }, picked);
            setSlot(updated.slot);
            setEndsAt(updated.endsAt);
          }}
        >
          <SelectTrigger id="convert-slot" className="h-11 rounded-xl">
            <SelectValue placeholder="No slot" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="none">No slot</SelectItem>
            {CRM_EVENT_SLOTS.map((value) => (
              <SelectItem key={value} value={value}>
                {SLOT_LABELS[value]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <p className="text-xs text-muted-foreground">Provide an end time or a slot. Morning, evening, or full day.</p>
      </div>
    </FormSheet>
  );
}
