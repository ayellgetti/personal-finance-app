import { FormEvent, useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { FormSheet } from "@/components/forms/FormSheet";
import { NativeSelect } from "@/components/forms/NativeSelect";
import { EmptyState, ErrorState, ForbiddenState, LoadingState } from "@/components/PageState";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { formatDateTime } from "@/lib/mobile/format";
import {
  cancelMessage,
  createMessage,
  createTemplate,
  listContacts,
  listMessages,
  listRecipients,
  listTemplates,
  removeTemplate,
} from "@/lib/mobile/remote";
import { useMobile } from "@/lib/mobile/store";
import { useCreateIntent } from "@/lib/mobile/use-create-intent";
import {
  CRM_CHANNELS,
  CRM_PERMISSIONS,
  type CrmChannel,
  type CrmContact,
  type CrmMessage,
  type CrmMessageTemplate,
  type CrmStaffRecipient,
} from "@/types/crm";

const CHANNEL_LABEL: Record<CrmChannel, string> = {
  email: "Email",
  sms: "SMS",
  in_app: "In-app",
};

type MessageForm = {
  channel: CrmChannel;
  mode: "template" | "custom";
  templateId: string;
  subject: string;
  body: string;
  contactId: string;
  recipientUserId: string;
  toAddress: string;
  scheduledAt: string;
};

const EMPTY: MessageForm = {
  channel: "email",
  mode: "custom",
  templateId: "",
  subject: "",
  body: "",
  contactId: "",
  recipientUserId: "",
  toAddress: "",
  scheduledAt: "",
};

function localDateTime(value: string): string | undefined {
  if (!value) return undefined;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return undefined;
  return date.toISOString();
}

export default function Communications() {
  const { permissions, status: sessionStatus } = useMobile();
  const allowed = permissions.includes(CRM_PERMISSIONS.communicationsRead);
  const canCreate = permissions.includes(CRM_PERMISSIONS.communicationsCreate);
  const canEdit = permissions.includes(CRM_PERMISSIONS.communicationsUpdate);
  const canDelete = permissions.includes(CRM_PERMISSIONS.communicationsDelete);
  const [panel, setPanel] = useState<"messages" | "templates">("messages");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [messages, setMessages] = useState<CrmMessage[]>([]);
  const [templates, setTemplates] = useState<CrmMessageTemplate[]>([]);
  const [contacts, setContacts] = useState<CrmContact[]>([]);
  const [staff, setStaff] = useState<CrmStaffRecipient[]>([]);
  const [form, setForm] = useState<MessageForm>(EMPTY);
  const [templateDraft, setTemplateDraft] = useState({ name: "", channel: "email" as CrmChannel, subject: "", body: "" });
  const [templateOpen, setTemplateOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [createOpen, setCreateOpen] = useCreateIntent(canCreate);

  const reload = useCallback(() => {
    if (!allowed) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    void Promise.all([listMessages({ limit: 50 }), listTemplates({ limit: 100 })])
      .then(([messagePage, templatePage]) => {
        setMessages(messagePage.items);
        setTemplates(templatePage.items);
      })
      .catch((reason: unknown) => {
        setError(reason instanceof Error ? reason.message : "Unable to load communications");
      })
      .finally(() => setLoading(false));
  }, [allowed]);

  useEffect(() => {
    if (sessionStatus === "ready") reload();
  }, [sessionStatus, reload]);

  useEffect(() => {
    if (!createOpen) return;
    void listContacts({ limit: 100 }).then((page) => setContacts(page.items)).catch(() => setContacts([]));
    void listRecipients().then(setStaff).catch(() => setStaff([]));
  }, [createOpen]);

  const submitMessage = (event: FormEvent) => {
    event.preventDefault();
    setBusy(true);
    const when = localDateTime(form.scheduledAt);
    void createMessage({
      channel: form.channel,
      ...(form.mode === "template"
        ? { templateId: form.templateId }
        : { subject: form.channel === "sms" ? undefined : form.subject, body: form.body }),
      ...(form.contactId ? { contactId: form.contactId } : {}),
      ...(form.recipientUserId ? { recipientUserId: form.recipientUserId } : {}),
      ...(form.toAddress.trim() ? { toAddress: form.toAddress.trim() } : {}),
      ...(when ? { scheduledAt: when } : {}),
    })
      .then((message) => {
        toast.success(message.status === "scheduled" ? "Scheduled" : message.status === "failed" ? "Saved with a delivery error" : "Sent");
        setCreateOpen(false);
        setForm(EMPTY);
        reload();
      })
      .catch((reason: unknown) => {
        toast.error(reason instanceof Error ? reason.message : "Unable to save the message");
      })
      .finally(() => setBusy(false));
  };

  const submitTemplate = (event: FormEvent) => {
    event.preventDefault();
    setBusy(true);
    void createTemplate({
      name: templateDraft.name.trim(),
      channel: templateDraft.channel,
      subject: templateDraft.channel === "sms" ? null : templateDraft.subject.trim(),
      body: templateDraft.body.trim(),
    })
      .then(() => {
        toast.success("Template saved");
        setTemplateOpen(false);
        setTemplateDraft({ name: "", channel: "email", subject: "", body: "" });
        reload();
      })
      .catch((reason: unknown) => {
        toast.error(reason instanceof Error ? reason.message : "Unable to save the template");
      })
      .finally(() => setBusy(false));
  };

  if (sessionStatus === "loading" || sessionStatus === "idle" || (sessionStatus === "ready" && loading)) {
    return <LoadingState />;
  }
  if (sessionStatus === "forbidden" || !allowed) return <ForbiddenState label="communications" />;
  if (sessionStatus === "error") return <ErrorState message="Unable to load your CRM session" onRetry={reload} />;
  if (error) return <ErrorState message={error} onRetry={reload} />;

  const channelTemplates = templates.filter((template) => template.channel === form.channel);

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <Button type="button" variant={panel === "messages" ? "default" : "outline"} onClick={() => setPanel("messages")}>
          Messages
        </Button>
        <Button type="button" variant={panel === "templates" ? "default" : "outline"} onClick={() => setPanel("templates")}>
          Templates
        </Button>
        {canCreate ? (
          <Button type="button" className="ml-auto" onClick={() => setCreateOpen(true)}>
            New
          </Button>
        ) : null}
      </div>

      {panel === "messages" && messages.length === 0 ? <EmptyState label="No messages yet" /> : null}
      {panel === "templates" && templates.length === 0 ? <EmptyState label="No templates yet" /> : null}

      {panel === "messages"
        ? messages.map((message) => (
            <article key={message.id} className="rounded-2xl border border-border p-3">
              <div className="flex items-center justify-between gap-2">
                <p className="text-sm font-medium">{CHANNEL_LABEL[message.channel]}</p>
                <Badge variant="secondary">{message.status}</Badge>
              </div>
              <p className="mt-2 text-sm">{message.subject || message.body}</p>
              <p className="mt-1 text-xs text-muted-foreground">
                {message.toAddress || "Staff inbox"} · {formatDateTime(message.sentAt || message.scheduledAt)}
              </p>
              {message.errorMessage ? <p className="mt-1 text-xs text-destructive">{message.errorMessage}</p> : null}
              {canEdit && message.status === "scheduled" ? (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="mt-2 px-0"
                  onClick={() => {
                    void cancelMessage(message.id)
                      .then(() => {
                        toast.success("Cancelled");
                        reload();
                      })
                      .catch((reason: unknown) => {
                        toast.error(reason instanceof Error ? reason.message : "Unable to cancel");
                      });
                  }}
                >
                  Cancel
                </Button>
              ) : null}
            </article>
          ))
        : templates.map((template) => (
            <article key={template.id} className="rounded-2xl border border-border p-3">
              <p className="text-sm font-medium">{template.name}</p>
              <p className="text-xs text-muted-foreground">{CHANNEL_LABEL[template.channel]}</p>
              <p className="mt-2 text-sm">{template.subject || template.body}</p>
              {canDelete ? (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="mt-2 px-0"
                  onClick={() => {
                    void removeTemplate(template.id)
                      .then(() => {
                        toast.success("Template removed");
                        reload();
                      })
                      .catch((reason: unknown) => {
                        toast.error(reason instanceof Error ? reason.message : "Unable to remove");
                      });
                  }}
                >
                  Remove
                </Button>
              ) : null}
            </article>
          ))}

      <FormSheet
        open={createOpen}
        onOpenChange={setCreateOpen}
        title="New message"
        description="Write it now or pick a template. Leave the time empty to send immediately."
        submitLabel={form.scheduledAt ? "Schedule" : "Send"}
        busy={busy}
        onSubmit={submitMessage}
      >
        <div className="space-y-1.5">
          <Label htmlFor="channel">Channel</Label>
          <NativeSelect id="channel" value={form.channel} onChange={(channel) => setForm({ ...form, channel: channel as CrmChannel, templateId: "" })}>
            {CRM_CHANNELS.map((channel) => (
              <option key={channel} value={channel}>
                {CHANNEL_LABEL[channel]}
              </option>
            ))}
          </NativeSelect>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="mode">Source</Label>
          <NativeSelect id="mode" value={form.mode} onChange={(mode) => setForm({ ...form, mode: mode as MessageForm["mode"] })}>
            <option value="custom">Write it now</option>
            <option value="template">Saved template</option>
          </NativeSelect>
        </div>
        {form.mode === "template" ? (
          <div className="space-y-1.5">
            <Label htmlFor="template">Template</Label>
            <NativeSelect id="template" value={form.templateId} onChange={(templateId) => setForm({ ...form, templateId })}>
              <option value="">Choose a template</option>
              {channelTemplates.map((template) => (
                <option key={template.id} value={template.id}>
                  {template.name}
                </option>
              ))}
            </NativeSelect>
          </div>
        ) : (
          <>
            {form.channel !== "sms" ? (
              <div className="space-y-1.5">
                <Label htmlFor="subject">Subject</Label>
                <Input id="subject" value={form.subject} onChange={(event) => setForm({ ...form, subject: event.target.value })} />
              </div>
            ) : null}
            <div className="space-y-1.5">
              <Label htmlFor="body">Message</Label>
              <Textarea id="body" value={form.body} onChange={(event) => setForm({ ...form, body: event.target.value })} />
            </div>
          </>
        )}
        <div className="space-y-1.5">
          <Label htmlFor="contact">Contact</Label>
          <NativeSelect id="contact" value={form.contactId} onChange={(contactId) => setForm({ ...form, contactId })}>
            <option value="">No contact</option>
            {contacts.map((contact) => (
              <option key={contact.id} value={contact.id}>
                {contact.name}
              </option>
            ))}
          </NativeSelect>
        </div>
        {form.channel === "in_app" ? (
          <div className="space-y-1.5">
            <Label htmlFor="staff">Staff</Label>
            <NativeSelect id="staff" value={form.recipientUserId} onChange={(recipientUserId) => setForm({ ...form, recipientUserId })}>
              <option value="">Choose staff</option>
              {staff.map((person) => (
                <option key={person.id} value={person.id}>
                  {person.firstName} {person.lastName}
                </option>
              ))}
            </NativeSelect>
          </div>
        ) : (
          <div className="space-y-1.5">
            <Label htmlFor="to">{form.channel === "email" ? "Email" : "Mobile"}</Label>
            <Input id="to" value={form.toAddress} placeholder="Uses the contact when empty" onChange={(event) => setForm({ ...form, toAddress: event.target.value })} />
          </div>
        )}
        <div className="space-y-1.5">
          <Label htmlFor="when">Send at</Label>
          <Input id="when" type="datetime-local" value={form.scheduledAt} onChange={(event) => setForm({ ...form, scheduledAt: event.target.value })} />
        </div>
      </FormSheet>

      <FormSheet
        open={templateOpen}
        onOpenChange={setTemplateOpen}
        title="New template"
        description="Placeholders such as {{name}} are filled when the template is used."
        submitLabel="Save template"
        busy={busy}
        onSubmit={submitTemplate}
      >
        <div className="space-y-1.5">
          <Label htmlFor="template-name">Name</Label>
          <Input id="template-name" value={templateDraft.name} onChange={(event) => setTemplateDraft({ ...templateDraft, name: event.target.value })} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="template-channel">Channel</Label>
          <NativeSelect id="template-channel" value={templateDraft.channel} onChange={(channel) => setTemplateDraft({ ...templateDraft, channel: channel as CrmChannel })}>
            {CRM_CHANNELS.map((channel) => (
              <option key={channel} value={channel}>
                {CHANNEL_LABEL[channel]}
              </option>
            ))}
          </NativeSelect>
        </div>
        {templateDraft.channel !== "sms" ? (
          <div className="space-y-1.5">
            <Label htmlFor="template-subject">Subject</Label>
            <Input id="template-subject" value={templateDraft.subject} onChange={(event) => setTemplateDraft({ ...templateDraft, subject: event.target.value })} />
          </div>
        ) : null}
        <div className="space-y-1.5">
          <Label htmlFor="template-body">Message</Label>
          <Textarea id="template-body" value={templateDraft.body} onChange={(event) => setTemplateDraft({ ...templateDraft, body: event.target.value })} />
        </div>
      </FormSheet>

      {canCreate && panel === "templates" ? (
        <Button type="button" variant="outline" onClick={() => setTemplateOpen(true)}>
          New template
        </Button>
      ) : null}
    </div>
  );
}
