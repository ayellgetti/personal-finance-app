import { FormEvent, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  ConfirmRemoveDialog,
  Field,
  ModuleStatus,
  NativeSelect,
} from "@/components/modules/shared";
import {
  TASK_STATUS_LABELS,
  formatDateTime,
  isoToLocalInput,
  localInputToIso,
  taskStatusOptions,
} from "@/lib/crm/display";
import { useCrm } from "@/lib/crm/store";
import { CRM_PERMISSIONS, CRM_TASK_STATUSES, type CreateTaskInput, type CrmTask, type CrmTaskStatus } from "@/types/crm";

type FormState = {
  title: string;
  description: string;
  status: CrmTaskStatus;
  dueAt: string;
};

const EMPTY: FormState = {
  title: "",
  description: "",
  status: "todo",
  dueAt: "",
};

function validate(form: FormState): Record<string, string> {
  const errors: Record<string, string> = {};
  if (!form.title.trim()) errors.title = "Title is required";
  return errors;
}

function toInput(form: FormState): CreateTaskInput {
  return {
    title: form.title.trim(),
    description: form.description.trim() || null,
    status: form.status,
    dueAt: form.dueAt ? localInputToIso(form.dueAt) : null,
  };
}

export function TasksModule() {
  const crm = useCrm();
  const sessionReady = crm.status === "ready";
  const allowed = crm.hasPermission(CRM_PERMISSIONS.tasksRead);
  const [form, setForm] = useState<FormState>(EMPTY);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [editing, setEditing] = useState<CrmTask | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [removeId, setRemoveId] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const reload = () => {
    void crm.loadTasks({ limit: 100 });
  };

  useEffect(() => {
    if (sessionReady && allowed) reload();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessionReady, allowed]);

  const openCreate = () => {
    setEditing(null);
    setForm(EMPTY);
    setErrors({});
    setDialogOpen(true);
  };

  const openEdit = (task: CrmTask) => {
    setEditing(task);
    setForm({
      title: task.title,
      description: task.description ?? "",
      status: task.status,
      dueAt: isoToLocalInput(task.dueAt),
    });
    setErrors({});
    setDialogOpen(true);
  };

  const onSubmit = async (event: FormEvent) => {
    event.preventDefault();
    const nextErrors = validate(form);
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length) return;
    setBusy(true);
    try {
      if (editing) await crm.updateTask(editing.id, toInput(form));
      else await crm.createTask(toInput(form));
      setDialogOpen(false);
    } catch {
      // toast handled in store
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        {crm.hasPermission(CRM_PERMISSIONS.tasksCreate) ? (
          <Button type="button" className="rounded-xl" onClick={openCreate}>
            Add task
          </Button>
        ) : null}
      </div>

      <ModuleStatus
        sessionReady={sessionReady}
        allowed={allowed}
        status={crm.tasks.status}
        errorMessage={crm.tasks.errorMessage}
        empty={crm.tasks.items.length === 0}
        emptyLabel="No tasks yet"
        onRetry={reload}
      >
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {CRM_TASK_STATUSES.map((column) => {
            const columnTasks = crm.tasks.items.filter((task) => task.status === column);
            return (
              <Card key={column} className="rounded-2xl shadow-[var(--shadow-card)]">
                <CardHeader>
                  <CardTitle className="text-base">
                    {TASK_STATUS_LABELS[column]} ({columnTasks.length})
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {columnTasks.map((task) => (
                    <div key={task.id} className="rounded-xl border bg-background p-3 shadow-sm">
                      <p className="font-medium">{task.title}</p>
                      {task.dueAt ? (
                        <p className="mt-1 text-xs text-muted-foreground">Due {formatDateTime(task.dueAt)}</p>
                      ) : null}
                      {crm.hasPermission(CRM_PERMISSIONS.tasksUpdate) ? (
                        <div className="mt-3 space-y-2">
                          <NativeSelect
                            aria-label={`Status for ${task.title}`}
                            value={task.status}
                            onChange={(value) => void crm.updateTaskStatus(task.id, value as CrmTaskStatus)}
                          >
                            {taskStatusOptions()}
                          </NativeSelect>
                          <div className="flex flex-wrap gap-1">
                            {CRM_TASK_STATUSES.filter((status) => status !== task.status).map((status) => (
                              <Button
                                key={status}
                                type="button"
                                size="sm"
                                variant="outline"
                                className="rounded-xl"
                                onClick={() => void crm.updateTaskStatus(task.id, status)}
                              >
                                Move to {TASK_STATUS_LABELS[status]}
                              </Button>
                            ))}
                          </div>
                        </div>
                      ) : null}
                      <div className="mt-2 flex gap-2">
                        {crm.hasPermission(CRM_PERMISSIONS.tasksUpdate) ? (
                          <Button type="button" size="sm" variant="ghost" onClick={() => openEdit(task)}>
                            Edit
                          </Button>
                        ) : null}
                        {crm.hasPermission(CRM_PERMISSIONS.tasksDelete) ? (
                          <Button type="button" size="sm" variant="ghost" onClick={() => setRemoveId(task.id)}>
                            Remove
                          </Button>
                        ) : null}
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            );
          })}
        </div>
      </ModuleStatus>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <form onSubmit={onSubmit} className="space-y-4">
            <DialogHeader>
              <DialogTitle>{editing ? "Edit task" : "Add task"}</DialogTitle>
            </DialogHeader>
            <Field id="task-title" label="Title" error={errors.title}>
              <Input
                id="task-title"
                value={form.title}
                onChange={(event) => setForm((current) => ({ ...current, title: event.target.value }))}
                className="rounded-xl"
              />
            </Field>
            <Field id="task-description" label="Description">
              <Textarea
                id="task-description"
                value={form.description}
                onChange={(event) => setForm((current) => ({ ...current, description: event.target.value }))}
                className="rounded-xl"
              />
            </Field>
            <Field id="task-status" label="Status">
              <NativeSelect
                id="task-status"
                value={form.status}
                onChange={(value) => setForm((current) => ({ ...current, status: value as CrmTaskStatus }))}
              >
                {taskStatusOptions()}
              </NativeSelect>
            </Field>
            <Field id="task-due" label="Due">
              <Input
                id="task-due"
                type="datetime-local"
                value={form.dueAt}
                onChange={(event) => setForm((current) => ({ ...current, dueAt: event.target.value }))}
                className="rounded-xl"
              />
            </Field>
            <DialogFooter>
              <Button type="submit" className="rounded-xl" disabled={busy}>
                {editing ? "Save" : "Create"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <ConfirmRemoveDialog
        open={Boolean(removeId)}
        title="Remove task"
        description="This task will be hidden from the board."
        onCancel={() => setRemoveId(null)}
        onConfirm={() => {
          if (!removeId) return;
          void crm.removeTask(removeId).finally(() => setRemoveId(null));
        }}
      />
    </div>
  );
}
