import { FormEvent, useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { FormSheet } from "@/components/forms/FormSheet";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { createEnquiry, listContacts } from "@/lib/mobile/remote";
import { useResource } from "@/lib/mobile/use-resource";

export function CreateEnquirySheet({
  open,
  onOpenChange,
  onCreated,
  defaultDate,
}: {
  open: boolean;
  onOpenChange: (next: boolean) => void;
  onCreated: () => void;
  defaultDate?: string;
}) {
  const [contactId, setContactId] = useState("");
  const [title, setTitle] = useState("");
  const [source, setSource] = useState("");
  const [dueDate, setDueDate] = useState(defaultDate ?? "");
  const [notes, setNotes] = useState("");
  const [busy, setBusy] = useState(false);

  // The picker only needs a first page of contacts; search lives on the Contacts tab.
  const loadContacts = useCallback(() => listContacts({ page: 1, limit: 50 }), []);
  const contacts = useResource(loadContacts, open);

  useEffect(() => {
    if (open && defaultDate) setDueDate(defaultDate);
  }, [open, defaultDate]);

  const onSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (!contactId) {
      toast.error("Pick a contact");
      return;
    }
    setBusy(true);
    try {
      await createEnquiry({
        contactId,
        title,
        source,
        dueDate: new Date(dueDate).toISOString(),
        notes: notes || null,
      });
      toast.success("Enquiry created");
      setContactId("");
      setTitle("");
      setSource("");
      setDueDate(defaultDate ?? "");
      setNotes("");
      onOpenChange(false);
      onCreated();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to create enquiry");
    } finally {
      setBusy(false);
    }
  };

  return (
    <FormSheet
      open={open}
      onOpenChange={onOpenChange}
      title="New enquiry"
      description="Start a sales case against a contact."
      submitLabel="Create enquiry"
      busy={busy}
      onSubmit={onSubmit}
    >
      <div className="space-y-2">
        <Label htmlFor="enquiry-contact">Contact</Label>
        <Select value={contactId} onValueChange={setContactId}>
          <SelectTrigger id="enquiry-contact" className="h-11 rounded-xl">
            <SelectValue placeholder={contacts.status === "loading" ? "Loading…" : "Pick a contact"} />
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
      <div className="space-y-2">
        <Label htmlFor="enquiry-title">Title</Label>
        <Input
          id="enquiry-title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="h-11 rounded-xl text-base"
          required
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="enquiry-source">Source</Label>
        <Input
          id="enquiry-source"
          value={source}
          onChange={(e) => setSource(e.target.value)}
          placeholder="Referral, website, walk-in…"
          className="h-11 rounded-xl text-base"
          required
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="enquiry-due">Due date</Label>
        <Input
          id="enquiry-due"
          type="date"
          value={dueDate}
          onChange={(e) => setDueDate(e.target.value)}
          className="h-11 rounded-xl text-base"
          required
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="enquiry-notes">Notes</Label>
        <Textarea
          id="enquiry-notes"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          className="rounded-xl text-base"
          rows={3}
        />
      </div>
    </FormSheet>
  );
}
