import { FormEvent, useEffect, useState } from "react";
import { toast } from "sonner";
import { FormSheet } from "@/components/forms/FormSheet";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toDateInputValue } from "@/lib/mobile/format";
import { createTask } from "@/lib/mobile/remote";

export function CreateTaskSheet({
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
  const [dueDate, setDueDate] = useState(() => toDateInputValue(day));
  const [dueTime, setDueTime] = useState("10:00");
  const [description, setDescription] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (open) setDueDate(toDateInputValue(day));
  }, [open, day]);

  const onSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setBusy(true);
    try {
      await createTask({
        title,
        dueAt: new Date(`${dueDate}T${dueTime}`).toISOString(),
        description: description || null,
      });
      toast.success("Task created");
      setTitle("");
      setDescription("");
      onOpenChange(false);
      onCreated();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to create task");
    } finally {
      setBusy(false);
    }
  };

  return (
    <FormSheet
      open={open}
      onOpenChange={onOpenChange}
      title="New task"
      description="Track something that has to get done."
      submitLabel="Create task"
      busy={busy}
      onSubmit={onSubmit}
    >
      <div className="space-y-2">
        <Label htmlFor="task-title">Title</Label>
        <Input
          id="task-title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="h-11 rounded-xl text-base"
          required
        />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-2">
          <Label htmlFor="task-due-date">Due date</Label>
          <Input
            id="task-due-date"
            type="date"
            value={dueDate}
            onChange={(e) => setDueDate(e.target.value)}
            className="h-11 rounded-xl text-base"
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="task-due-time">Due time</Label>
          <Input
            id="task-due-time"
            type="time"
            value={dueTime}
            onChange={(e) => setDueTime(e.target.value)}
            className="h-11 rounded-xl text-base"
            required
          />
        </div>
      </div>
      <div className="space-y-2">
        <Label htmlFor="task-description">Description</Label>
        <Textarea
          id="task-description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className="rounded-xl text-base"
          rows={3}
        />
      </div>
    </FormSheet>
  );
}
