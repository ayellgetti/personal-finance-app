import { FormEvent, useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { FormSheet } from "@/components/forms/FormSheet";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { humanize, toDateInputValue } from "@/lib/mobile/format";
import { createFollowUp, listEnquiries } from "@/lib/mobile/remote";
import { useResource } from "@/lib/mobile/use-resource";
import { CRM_ENQUIRY_STATUSES, type CrmEnquiryStatus } from "@/types/crm";

export function CreateFollowUpSheet({
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
  const [enquiryId, setEnquiryId] = useState("");
  const [stage, setStage] = useState<CrmEnquiryStatus>("contacted");
  const [dueDate, setDueDate] = useState(() => toDateInputValue(day));
  const [dueTime, setDueTime] = useState("10:00");
  const [nextDate, setNextDate] = useState(() => toDateInputValue(day));
  const [notes, setNotes] = useState("");
  const [busy, setBusy] = useState(false);

  const loadEnquiries = useCallback(() => listEnquiries({ page: 1, limit: 50 }), []);
  const enquiries = useResource(loadEnquiries, open);

  useEffect(() => {
    if (!open) return;
    const value = toDateInputValue(day);
    setDueDate(value);
    setNextDate(value);
  }, [open, day]);

  const onSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (!enquiryId) {
      toast.error("Pick an enquiry");
      return;
    }
    setBusy(true);
    try {
      await createFollowUp({
        enquiryId,
        stage,
        dueAt: new Date(`${dueDate}T${dueTime}`).toISOString(),
        nextFollowupDate: new Date(`${nextDate}T${dueTime}`).toISOString(),
        notes: notes || null,
      });
      toast.success("Follow-up logged");
      setEnquiryId("");
      setNotes("");
      onOpenChange(false);
      onCreated();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to log follow-up");
    } finally {
      setBusy(false);
    }
  };

  return (
    <FormSheet
      open={open}
      onOpenChange={onOpenChange}
      title="New follow-up"
      description="Log the touchpoint and set the next one."
      submitLabel="Log follow-up"
      busy={busy}
      onSubmit={onSubmit}
    >
      <div className="space-y-2">
        <Label htmlFor="followup-enquiry">Enquiry</Label>
        <Select value={enquiryId} onValueChange={setEnquiryId}>
          <SelectTrigger id="followup-enquiry" className="h-11 rounded-xl">
            <SelectValue placeholder={enquiries.status === "loading" ? "Loading…" : "Pick an enquiry"} />
          </SelectTrigger>
          <SelectContent className="max-h-72">
            {(enquiries.data?.items ?? []).map((enquiry) => (
              <SelectItem key={enquiry.id} value={enquiry.id}>
                {enquiry.title}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-2">
        <Label htmlFor="followup-stage">Stage</Label>
        <Select value={stage} onValueChange={(next) => setStage(next as CrmEnquiryStatus)}>
          <SelectTrigger id="followup-stage" className="h-11 rounded-xl">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {CRM_ENQUIRY_STATUSES.map((value) => (
              <SelectItem key={value} value={value}>
                {humanize(value)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-2">
          <Label htmlFor="followup-due">Done on</Label>
          <Input
            id="followup-due"
            type="date"
            value={dueDate}
            onChange={(e) => setDueDate(e.target.value)}
            className="h-11 rounded-xl text-base"
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="followup-time">At</Label>
          <Input
            id="followup-time"
            type="time"
            value={dueTime}
            onChange={(e) => setDueTime(e.target.value)}
            className="h-11 rounded-xl text-base"
            required
          />
        </div>
      </div>
      <div className="space-y-2">
        <Label htmlFor="followup-next">Next follow-up</Label>
        <Input
          id="followup-next"
          type="date"
          value={nextDate}
          onChange={(e) => setNextDate(e.target.value)}
          className="h-11 rounded-xl text-base"
          required
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="followup-notes">Notes</Label>
        <Textarea
          id="followup-notes"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          className="rounded-xl text-base"
          rows={3}
        />
      </div>
    </FormSheet>
  );
}
