import { FormEvent, useEffect, useMemo, useState } from "react";
import { FileText, Send } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import {
  ConfirmRemoveDialog,
  Field,
  ModulePage,
  ModuleStatus,
  NativeSelect,
  RemoveAction,
  RowActions,
  SideSheet,
  StatusBadge,
  ViewAction,
} from "@/components/modules/shared";
import { formatDateTime } from "@/lib/crm/display";
import { useCrm } from "@/lib/crm/store";
import {
  cancelMessage,
  createMessage,
  createTemplate,
  listContacts,
  listMessages,
  listRecipients,
  listTemplates,
  removeMessage,
  removeTemplate,
  updateMessage,
  updateTemplate,
} from "@/lib/crm/remote";
import {
  CRM_CHANNELS,
  CRM_MESSAGE_STATUSES,
  CRM_PERMISSIONS,
  type CrmChannel,
  type CrmContact,
  type CrmMessage,
  type CrmMessageStatus,
  type CrmMessageTemplate,
  type CrmStaffRecipient,
} from "@/types/crm";

const CHANNEL_LABEL: Record<CrmChannel, string> = {
  email: "Email",
  sms: "SMS",
  in_app: "In-app",
};

const STATUS_LABEL: Record<CrmMessageStatus, string> = {
  scheduled: "Scheduled",
  sending: "Sending",
  sent: "Sent",
  failed: "Failed",
  cancelled: "Cancelled",
};

type Panel = "messages" | "templates";

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
  variableKey: string;
  variableValue: string;
};

type TemplateForm = {
  name: string;
  channel: CrmChannel;
  subject: string;
  body: string;
};

const EMPTY_MESSAGE: MessageForm = {
  channel: "email",
  mode: "custom",
  templateId: "",
  subject: "",
  body: "",
  contactId: "",
  recipientUserId: "",
  toAddress: "",
  scheduledAt: "",
  variableKey: "",
  variableValue: "",
};

const EMPTY_TEMPLATE: TemplateForm = { name: "", channel: "email", subject: "", body: "" };

function localDateTime(value: string): string | undefined {
  if (!value) return undefined;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return undefined;
  return date.toISOString();
}

function toLocalInput(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  const pad = (part: number) => String(part).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

function preview(message: CrmMessage): string {
  return message.subject || message.body.slice(0, 80);
}

export function CommunicationsModule() {
  const crm = useCrm();
  const sessionReady = crm.status === "ready";
  const allowed = crm.hasPermission(CRM_PERMISSIONS.communicationsRead);
  const canCreate = crm.hasPermission(CRM_PERMISSIONS.communicationsCreate);
  const canEdit = crm.hasPermission(CRM_PERMISSIONS.communicationsUpdate);
  const canDelete = crm.hasPermission(CRM_PERMISSIONS.communicationsDelete);
  const [panel, setPanel] = useState<Panel>("messages");
  const [status, setStatus] = useState<"idle" | "loading" | "ready" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [messages, setMessages] = useState<CrmMessage[]>([]);
  const [templates, setTemplates] = useState<CrmMessageTemplate[]>([]);
  const [contacts, setContacts] = useState<CrmContact[]>([]);
  const [staff, setStaff] = useState<CrmStaffRecipient[]>([]);
  const [channelFilter, setChannelFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [messageForm, setMessageForm] = useState<MessageForm>(EMPTY_MESSAGE);
  const [templateForm, setTemplateForm] = useState<TemplateForm>(EMPTY_TEMPLATE);
  const [editingTemplate, setEditingTemplate] = useState<CrmMessageTemplate | null>(null);
  const [viewing, setViewing] = useState<CrmMessage | null>(null);
  const [rescheduleAt, setRescheduleAt] = useState("");
  const [composeOpen, setComposeOpen] = useState(false);
  const [templateOpen, setTemplateOpen] = useState(false);
  const [removeTarget, setRemoveTarget] = useState<{ kind: "message" | "template"; id: string } | null>(null);
  const [busy, setBusy] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const channelTemplates = useMemo(
    () => templates.filter((template) => template.channel === messageForm.channel),
    [templates, messageForm.channel],
  );

  const reload = () => {
    if (!allowed) return;
    setStatus("loading");
    setErrorMessage(null);
    const messagesRequest = listMessages({
      channel: channelFilter ? (channelFilter as CrmChannel) : undefined,
      status: statusFilter ? (statusFilter as CrmMessageStatus) : undefined,
      limit: 50,
    });
    const templatesRequest = listTemplates({ limit: 100 });
    void Promise.all([messagesRequest, templatesRequest])
      .then(([messagePage, templatePage]) => {
        setMessages(messagePage.items);
        setTemplates(templatePage.items);
        setStatus("ready");
      })
      .catch((error: unknown) => {
        setStatus("error");
        setErrorMessage(error instanceof Error ? error.message : "Unable to load communications");
      });
  };

  useEffect(() => {
    if (sessionReady && allowed) reload();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- reload when the filters change
  }, [sessionReady, allowed, channelFilter, statusFilter]);

  const loadPickers = () => {
    void listContacts({ limit: 100 })
      .then((page) => setContacts(page.items))
      .catch(() => setContacts([]));
    if (!canCreate) return;
    void listRecipients()
      .then(setStaff)
      .catch(() => setStaff([]));
  };

  const openCompose = () => {
    setMessageForm(EMPTY_MESSAGE);
    setFormError(null);
    setComposeOpen(true);
    loadPickers();
  };

  const openTemplate = (template: CrmMessageTemplate | null) => {
    setEditingTemplate(template);
    setTemplateForm(
      template
        ? {
            name: template.name,
            channel: template.channel,
            subject: template.subject ?? "",
            body: template.body,
          }
        : EMPTY_TEMPLATE,
    );
    setFormError(null);
    setTemplateOpen(true);
  };

  const submitMessage = (event: FormEvent) => {
    event.preventDefault();
    setBusy(true);
    setFormError(null);
    const variables =
      messageForm.variableKey.trim().length > 0
        ? { [messageForm.variableKey.trim()]: messageForm.variableValue }
        : undefined;
    void createMessage({
      channel: messageForm.channel,
      ...(messageForm.mode === "template"
        ? { templateId: messageForm.templateId }
        : {
            subject: messageForm.channel === "sms" ? undefined : messageForm.subject,
            body: messageForm.body,
          }),
      ...(messageForm.contactId ? { contactId: messageForm.contactId } : {}),
      ...(messageForm.recipientUserId ? { recipientUserId: messageForm.recipientUserId } : {}),
      ...(messageForm.toAddress.trim() ? { toAddress: messageForm.toAddress.trim() } : {}),
      ...(variables ? { variables } : {}),
      ...(localDateTime(messageForm.scheduledAt) ? { scheduledAt: localDateTime(messageForm.scheduledAt) } : {}),
    })
      .then((message) => {
        toast.success(message.status === "scheduled" ? "Message scheduled" : message.status === "failed" ? "Message saved with a delivery error" : "Message sent");
        setComposeOpen(false);
        reload();
      })
      .catch((error: unknown) => {
        setFormError(error instanceof Error ? error.message : "Unable to save the message");
      })
      .finally(() => setBusy(false));
  };

  const submitTemplate = (event: FormEvent) => {
    event.preventDefault();
    setBusy(true);
    setFormError(null);
    const input = {
      name: templateForm.name.trim(),
      channel: templateForm.channel,
      subject: templateForm.channel === "sms" ? null : templateForm.subject.trim(),
      body: templateForm.body.trim(),
    };
    const request = editingTemplate ? updateTemplate(editingTemplate.id, input) : createTemplate(input);
    void request
      .then(() => {
        toast.success(editingTemplate ? "Template updated" : "Template saved");
        setTemplateOpen(false);
        reload();
      })
      .catch((error: unknown) => {
        setFormError(error instanceof Error ? error.message : "Unable to save the template");
      })
      .finally(() => setBusy(false));
  };

  const saveSchedule = () => {
    if (!viewing) return;
    const scheduledAt = localDateTime(rescheduleAt);
    if (!scheduledAt) return;
    setBusy(true);
    void updateMessage(viewing.id, { scheduledAt })
      .then((message) => {
        toast.success(message.status === "sent" ? "Message sent" : "Schedule updated");
        setViewing(message.status === "scheduled" ? message : null);
        reload();
      })
      .catch((error: unknown) => {
        toast.error(error instanceof Error ? error.message : "Unable to change the schedule");
      })
      .finally(() => setBusy(false));
  };

  const empty = panel === "messages" ? messages.length === 0 : templates.length === 0;

  return (
    <ModulePage
      crumb="Communications"
      view={panel}
      onViewChange={(next) => setPanel(next as Panel)}
      viewOptions={[
        { key: "messages", label: "Messages", shortLabel: "Messages", icon: <Send className="h-4 w-4" /> },
        { key: "templates", label: "Templates", shortLabel: "Templates", icon: <FileText className="h-4 w-4" /> },
      ]}
      actions={
        canCreate ? (
          <div className="flex gap-2">
            <Button type="button" variant="outline" onClick={() => openTemplate(null)}>
              New template
            </Button>
            <Button type="button" onClick={openCompose}>
              New message
            </Button>
          </div>
        ) : null
      }
      toolbar={
        panel === "messages" ? (
          <div className="flex flex-wrap gap-2">
            <NativeSelect aria-label="Channel" value={channelFilter} onChange={setChannelFilter} className="w-36">
              <option value="">All channels</option>
              {CRM_CHANNELS.map((channel) => (
                <option key={channel} value={channel}>
                  {CHANNEL_LABEL[channel]}
                </option>
              ))}
            </NativeSelect>
            <NativeSelect aria-label="Status" value={statusFilter} onChange={setStatusFilter} className="w-36">
              <option value="">All statuses</option>
              {CRM_MESSAGE_STATUSES.map((item) => (
                <option key={item} value={item}>
                  {STATUS_LABEL[item]}
                </option>
              ))}
            </NativeSelect>
          </div>
        ) : null
      }
    >
      <ModuleStatus
        sessionReady={sessionReady}
        allowed={allowed}
        status={status}
        errorMessage={errorMessage}
        empty={empty}
        emptyLabel={panel === "messages" ? "No messages yet" : "No templates yet"}
        onRetry={reload}
      >
        {panel === "messages" ? (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Channel</TableHead>
                <TableHead>Message</TableHead>
                <TableHead>To</TableHead>
                <TableHead>When</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="w-28" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {messages.map((message) => (
                <TableRow key={message.id}>
                  <TableCell>{CHANNEL_LABEL[message.channel]}</TableCell>
                  <TableCell className="max-w-xs truncate">{preview(message)}</TableCell>
                  <TableCell>{message.toAddress || "Staff inbox"}</TableCell>
                  <TableCell>{formatDateTime(message.sentAt || message.scheduledAt)}</TableCell>
                  <TableCell>
                    <StatusBadge status={message.status} label={STATUS_LABEL[message.status]} />
                  </TableCell>
                  <TableCell>
                    <RowActions>
                      <ViewAction
                        onClick={() => {
                          setViewing(message);
                          setRescheduleAt(toLocalInput(message.scheduledAt));
                        }}
                      />
                      {canEdit && message.status === "scheduled" ? (
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            void cancelMessage(message.id)
                              .then(() => {
                                toast.success("Message cancelled");
                                reload();
                              })
                              .catch((error: unknown) => {
                                toast.error(error instanceof Error ? error.message : "Unable to cancel");
                              });
                          }}
                        >
                          Cancel
                        </Button>
                      ) : null}
                      {canDelete ? <RemoveAction onClick={() => setRemoveTarget({ kind: "message", id: message.id })} /> : null}
                    </RowActions>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Channel</TableHead>
                <TableHead>Preview</TableHead>
                <TableHead className="w-24" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {templates.map((template) => (
                <TableRow key={template.id}>
                  <TableCell>{template.name}</TableCell>
                  <TableCell>{CHANNEL_LABEL[template.channel]}</TableCell>
                  <TableCell className="max-w-md truncate">{template.subject || template.body}</TableCell>
                  <TableCell>
                    <RowActions>
                      {canEdit ? (
                        <Button type="button" variant="ghost" size="sm" onClick={() => openTemplate(template)}>
                          Edit
                        </Button>
                      ) : null}
                      {canDelete ? <RemoveAction onClick={() => setRemoveTarget({ kind: "template", id: template.id })} /> : null}
                    </RowActions>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </ModuleStatus>

      <SideSheet
        open={composeOpen}
        onOpenChange={setComposeOpen}
        title="New message"
        description="Use a saved template or write the message now. Leave the schedule empty to send immediately."
        onSubmit={submitMessage}
        footer={
          <Button type="submit" disabled={busy}>
            {messageForm.scheduledAt ? "Schedule" : "Send now"}
          </Button>
        }
      >
        <Field id="channel" label="Channel">
          <NativeSelect id="channel" value={messageForm.channel} onChange={(channel) => setMessageForm({ ...messageForm, channel: channel as CrmChannel, templateId: "" })}>
            {CRM_CHANNELS.map((channel) => (
              <option key={channel} value={channel}>
                {CHANNEL_LABEL[channel]}
              </option>
            ))}
          </NativeSelect>
        </Field>
        <Field id="mode" label="Source">
          <NativeSelect id="mode" value={messageForm.mode} onChange={(mode) => setMessageForm({ ...messageForm, mode: mode as MessageForm["mode"] })}>
            <option value="custom">Write it now</option>
            <option value="template">Saved template</option>
          </NativeSelect>
        </Field>
        {messageForm.mode === "template" ? (
          <Field id="template" label="Template">
            <NativeSelect id="template" value={messageForm.templateId} onChange={(templateId) => setMessageForm({ ...messageForm, templateId })}>
              <option value="">Choose a template</option>
              {channelTemplates.map((template) => (
                <option key={template.id} value={template.id}>
                  {template.name}
                </option>
              ))}
            </NativeSelect>
          </Field>
        ) : (
          <>
            {messageForm.channel !== "sms" ? (
              <Field id="subject" label="Subject">
                <Input id="subject" value={messageForm.subject} onChange={(event) => setMessageForm({ ...messageForm, subject: event.target.value })} />
              </Field>
            ) : null}
            <Field id="body" label="Message">
              <Textarea id="body" value={messageForm.body} onChange={(event) => setMessageForm({ ...messageForm, body: event.target.value })} />
            </Field>
          </>
        )}
        <Field id="contact" label="Contact">
          <NativeSelect id="contact" value={messageForm.contactId} onChange={(contactId) => setMessageForm({ ...messageForm, contactId })}>
            <option value="">No contact</option>
            {contacts.map((contact) => (
              <option key={contact.id} value={contact.id}>
                {contact.name} · {contact.mobile}
              </option>
            ))}
          </NativeSelect>
        </Field>
        {messageForm.channel === "in_app" ? (
          <Field id="staff" label="Staff recipient">
            <NativeSelect id="staff" value={messageForm.recipientUserId} onChange={(recipientUserId) => setMessageForm({ ...messageForm, recipientUserId })}>
              <option value="">Choose staff</option>
              {staff.map((person) => (
                <option key={person.id} value={person.id}>
                  {person.firstName} {person.lastName}
                </option>
              ))}
            </NativeSelect>
          </Field>
        ) : (
          <Field id="to" label={messageForm.channel === "email" ? "Email address" : "Mobile number"}>
            <Input
              id="to"
              value={messageForm.toAddress}
              placeholder="Uses the contact when left empty"
              onChange={(event) => setMessageForm({ ...messageForm, toAddress: event.target.value })}
            />
          </Field>
        )}
        <div className="grid gap-3 sm:grid-cols-2">
          <Field id="variable-key" label="Extra placeholder">
            <Input id="variable-key" value={messageForm.variableKey} placeholder="name" onChange={(event) => setMessageForm({ ...messageForm, variableKey: event.target.value })} />
          </Field>
          <Field id="variable-value" label="Value">
            <Input id="variable-value" value={messageForm.variableValue} onChange={(event) => setMessageForm({ ...messageForm, variableValue: event.target.value })} />
          </Field>
        </div>
        <p className="text-xs text-muted-foreground">Contact fields fill {"{{name}}"}, {"{{mobile}}"}, {"{{email}}"}, and {"{{company}}"}.</p>
        <Field id="when" label="Send at">
          <Input id="when" type="datetime-local" value={messageForm.scheduledAt} onChange={(event) => setMessageForm({ ...messageForm, scheduledAt: event.target.value })} />
        </Field>
        {formError ? <p className="text-sm text-destructive">{formError}</p> : null}
      </SideSheet>

      <SideSheet
        open={templateOpen}
        onOpenChange={setTemplateOpen}
        title={editingTemplate ? "Edit template" : "New template"}
        description="Placeholders such as {{name}} are filled when the template is used."
        onSubmit={submitTemplate}
        footer={
          <Button type="submit" disabled={busy}>
            Save template
          </Button>
        }
      >
        <Field id="template-name" label="Name">
          <Input id="template-name" value={templateForm.name} onChange={(event) => setTemplateForm({ ...templateForm, name: event.target.value })} />
        </Field>
        <Field id="template-channel" label="Channel">
          <NativeSelect id="template-channel" value={templateForm.channel} onChange={(channel) => setTemplateForm({ ...templateForm, channel: channel as CrmChannel })}>
            {CRM_CHANNELS.map((channel) => (
              <option key={channel} value={channel}>
                {CHANNEL_LABEL[channel]}
              </option>
            ))}
          </NativeSelect>
        </Field>
        {templateForm.channel !== "sms" ? (
          <Field id="template-subject" label="Subject">
            <Input id="template-subject" value={templateForm.subject} onChange={(event) => setTemplateForm({ ...templateForm, subject: event.target.value })} />
          </Field>
        ) : null}
        <Field id="template-body" label="Body">
          <Textarea id="template-body" value={templateForm.body} onChange={(event) => setTemplateForm({ ...templateForm, body: event.target.value })} />
        </Field>
        {formError ? <p className="text-sm text-destructive">{formError}</p> : null}
      </SideSheet>

      <SideSheet
        open={Boolean(viewing)}
        onOpenChange={(open) => {
          if (!open) setViewing(null);
        }}
        title={viewing ? CHANNEL_LABEL[viewing.channel] : "Message"}
        description={viewing?.toAddress || "In-app notification"}
      >
        {viewing ? (
          <div className="space-y-4">
            <StatusBadge status={viewing.status} label={STATUS_LABEL[viewing.status]} />
            {viewing.subject ? <p className="font-medium">{viewing.subject}</p> : null}
            <p className="whitespace-pre-wrap text-sm">{viewing.body}</p>
            <p className="text-sm text-muted-foreground">Scheduled {formatDateTime(viewing.scheduledAt)}</p>
            {viewing.errorMessage ? <p className="text-sm text-destructive">{viewing.errorMessage}</p> : null}
            {canEdit && viewing.status === "scheduled" ? (
              <Field id="reschedule" label="Change schedule">
                <div className="flex gap-2">
                  <Input id="reschedule" type="datetime-local" value={rescheduleAt} onChange={(event) => setRescheduleAt(event.target.value)} />
                  <Button type="button" disabled={busy} onClick={saveSchedule}>
                    Save
                  </Button>
                </div>
              </Field>
            ) : null}
          </div>
        ) : null}
      </SideSheet>

      <ConfirmRemoveDialog
        open={Boolean(removeTarget)}
        title={removeTarget?.kind === "template" ? "Remove template" : "Remove message"}
        description="This hides the record. A scheduled message is cancelled first."
        onCancel={() => setRemoveTarget(null)}
        onConfirm={() => {
          if (!removeTarget) return;
          const request = removeTarget.kind === "template" ? removeTemplate(removeTarget.id) : removeMessage(removeTarget.id);
          void request
            .then(() => {
              toast.success("Removed");
              setRemoveTarget(null);
              reload();
            })
            .catch((error: unknown) => {
              toast.error(error instanceof Error ? error.message : "Unable to remove");
            });
        }}
      />
    </ModulePage>
  );
}
