import { FormEvent, useEffect, useState } from "react";
import { toast } from "sonner";
import { FormSheet } from "@/components/forms/FormSheet";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { isoToLocalInput, localInputToIso } from "@/lib/mobile/booking";
import { humanize, toDateInputValue } from "@/lib/mobile/format";
import { createTask, updateTask } from "@/lib/mobile/remote";
import { toTaskInput, validateTask } from "@/lib/mobile/validate";
import { CRM_TASK_STATUSES, type CrmTask, type CrmTaskStatus } from "@/types/crm";

const NONE = "none";

export type TaskLinkOption = { id: string; label: string };

function dueIso(value: string): string | null {
  if (!value || Number.isNaN(new Date(value).getTime())) return null;
  return localInputToIso(value);
}

function withCurrent(options: TaskLinkOption[], value: string, fallback: string): TaskLinkOption[] {
  if (value === NONE || options.some((option) => option.id === value)) return options;
  return [...options, { id: value, label: fallback }];
}

function LinkField({
  id,
  label,
  value,
  options,
  emptyLabel,
  fallbackLabel,
  onChange,
}: {
  id: string;
  label: string;
  value: string;
  options: TaskLinkOption[];
  emptyLabel: string;
  fallbackLabel: string;
  onChange: (next: string) => void;
}) {
  const items = withCurrent(options, value, fallbackLabel);
  return (
    <div className="space-y-2">
      <Label htmlFor={id}>{label}</Label>
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger id={id} className="h-11 rounded-xl">
          <SelectValue />
        </SelectTrigger>
        <SelectContent className="max-h-72">
          <SelectItem value={NONE}>{emptyLabel}</SelectItem>
          {items.map((option) => (
            <SelectItem key={option.id} value={option.id}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}

export function CreateTaskSheet({
  open,
  onOpenChange,
  day,
  onCreated,
  task = null,
  assignees,
  contacts,
  enquiries,
}: {
  open: boolean;
  onOpenChange: (next: boolean) => void;
  day: Date;
  onCreated: () => void;
  task?: CrmTask | null;
  /** Pass an array when the reader may link that record. Omit it to hide the field. */
  assignees?: TaskLinkOption[];
  contacts?: TaskLinkOption[];
  enquiries?: TaskLinkOption[];
}) {
  const dayKey = toDateInputValue(day);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [status, setStatus] = useState<CrmTaskStatus>("todo");
  const [dueAt, setDueAt] = useState(() => `${toDateInputValue(day)}T10:00`);
  const [assigneeId, setAssigneeId] = useState(NONE);
  const [contactId, setContactId] = useState(NONE);
  const [enquiryId, setEnquiryId] = useState(NONE);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!open) return;
    setErrors({});
    if (task) {
      setTitle(task.title);
      setDescription(task.description ?? "");
      setStatus(task.status);
      setDueAt(isoToLocalInput(task.dueAt));
      setAssigneeId(task.assigneeId ?? NONE);
      setContactId(task.contactId ?? NONE);
      setEnquiryId(task.enquiryId ?? NONE);
      return;
    }
    setTitle("");
    setDescription("");
    setStatus("todo");
    setDueAt(`${dayKey}T10:00`);
    setAssigneeId(NONE);
    setContactId(NONE);
    setEnquiryId(NONE);
  }, [open, task, dayKey]);

  const onSubmit = async (event: FormEvent) => {
    event.preventDefault();
    const nextErrors = validateTask({ title, description });
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) {
      toast.error(nextErrors.title ?? nextErrors.description ?? "Check the task");
      return;
    }
    const input = toTaskInput({
      title,
      description,
      dueAt: dueIso(dueAt),
      status,
      assigneeId: assignees ? (assigneeId === NONE ? null : assigneeId) : (task?.assigneeId ?? null),
      contactId: contacts ? (contactId === NONE ? null : contactId) : (task?.contactId ?? null),
      enquiryId: enquiries ? (enquiryId === NONE ? null : enquiryId) : (task?.enquiryId ?? null),
    });
    setBusy(true);
    try {
      if (task) await updateTask(task.id, input);
      else await createTask(input);
      toast.success(task ? "Task updated" : "Task created");
      if (!task) {
        setTitle("");
        setDescription("");
      }
      onOpenChange(false);
      onCreated();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : task ? "Unable to update task" : "Unable to create task");
    } finally {
      setBusy(false);
    }
  };

  return (
    <FormSheet
      open={open}
      onOpenChange={onOpenChange}
      title={task ? "Edit task" : "New task"}
      description={task ? "Update what has to get done." : "Track something that has to get done."}
      submitLabel={task ? "Save task" : "Create task"}
      busy={busy}
      onSubmit={onSubmit}
    >
      <div className="space-y-2">
        <Label htmlFor="task-title">Title</Label>
        <Input
          id="task-title"
          value={title}
          onChange={(event) => setTitle(event.target.value)}
          className="h-11 rounded-xl text-base"
        />
        {errors.title ? <p className="text-xs text-destructive">{errors.title}</p> : null}
      </div>
      <div className="space-y-2">
        <Label htmlFor="task-status">Status</Label>
        <Select value={status} onValueChange={(next) => setStatus(next as CrmTaskStatus)}>
          <SelectTrigger id="task-status" className="h-11 rounded-xl">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {CRM_TASK_STATUSES.map((value) => (
              <SelectItem key={value} value={value}>
                {humanize(value)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-2">
        <Label htmlFor="task-due">Due</Label>
        <Input
          id="task-due"
          type="datetime-local"
          value={dueAt}
          onChange={(event) => setDueAt(event.target.value)}
          className="h-11 rounded-xl text-base"
        />
        <p className="text-xs text-muted-foreground">Clear it to leave the task without a due date.</p>
      </div>
      {assignees ? (
        <LinkField
          id="task-assignee"
          label="Assignee"
          value={assigneeId}
          options={assignees}
          emptyLabel="No assignee"
          fallbackLabel="Current assignee"
          onChange={setAssigneeId}
        />
      ) : null}
      {contacts ? (
        <LinkField
          id="task-contact"
          label="Contact"
          value={contactId}
          options={contacts}
          emptyLabel="No contact"
          fallbackLabel="Current contact"
          onChange={setContactId}
        />
      ) : null}
      {enquiries ? (
        <LinkField
          id="task-enquiry"
          label="Enquiry"
          value={enquiryId}
          options={enquiries}
          emptyLabel="No enquiry"
          fallbackLabel="Current enquiry"
          onChange={setEnquiryId}
        />
      ) : null}
      <div className="space-y-2">
        <Label htmlFor="task-description">Description</Label>
        <Textarea
          id="task-description"
          value={description}
          onChange={(event) => setDescription(event.target.value)}
          className="rounded-xl text-base"
          rows={3}
        />
        {errors.description ? <p className="text-xs text-destructive">{errors.description}</p> : null}
      </div>
    </FormSheet>
  );
}
