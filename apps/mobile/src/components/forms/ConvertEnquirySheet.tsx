import { FormEvent, useEffect, useState } from "react";
import { toast } from "sonner";
import { FormSheet } from "@/components/forms/FormSheet";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
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
  const [startsAt, setStartsAt] = useState("");
  const [endsAt, setEndsAt] = useState("");
  const [slot, setSlot] = useState<CrmEventSlot | "">("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    setStartsAt("");
    setEndsAt("");
    setSlot("");
  }, [enquiry?.id]);

  const onSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (!enquiry) return;
    if (startsAt && !endsAt && !slot) {
      toast.error("Add an end time or a slot");
      return;
    }
    if ((endsAt || slot) && !startsAt) {
      toast.error("Add a start time");
      return;
    }
    setBusy(true);
    try {
      await convertEnquiry(enquiry.id, {
        startsAt: startsAt ? new Date(startsAt).toISOString() : undefined,
        endsAt: endsAt ? new Date(endsAt).toISOString() : null,
        slot: slot || null,
      });
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
        <Label htmlFor="convert-start">Event start</Label>
        <Input
          id="convert-start"
          type="datetime-local"
          value={startsAt}
          onChange={(event) => setStartsAt(event.target.value)}
          className="h-11 rounded-xl text-base"
        />
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
      </div>
      <div className="space-y-2">
        <Label htmlFor="convert-slot">Slot</Label>
        <Select value={slot || "none"} onValueChange={(next) => setSlot(next === "none" ? "" : (next as CrmEventSlot))}>
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
