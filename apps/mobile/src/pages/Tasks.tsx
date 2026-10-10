import { useCallback, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { toast } from "sonner";
import { ConfirmInline } from "@/components/ConfirmInline";
import { EmptyState, ErrorState, ForbiddenState, LoadingState } from "@/components/PageState";
import type { ChipOption } from "@/components/FilterChips";
import { ViewSwitch } from "@/components/ViewSwitch";
import { FilterSortBar, type FilterSection } from "@/components/FilterSortSheet";
import { CreateTaskSheet, type TaskLinkOption } from "@/components/forms/CreateTaskSheet";
import { NativeSelect } from "@/components/forms/NativeSelect";
import { ListRow } from "@/components/ListRow";
import { LoadMore } from "@/components/LoadMore";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { formatDateTime, humanize, matchesQuery, personLine } from "@/lib/mobile/format";
import { compareText, compareTime, type SortOrder } from "@/lib/mobile/sort";
import {
  listContacts,
  listCrmUsers,
  listEnquiries,
  listTasks,
  removeTask,
  updateTaskStatus,
} from "@/lib/mobile/remote";
import { useMobile } from "@/lib/mobile/store";
import { useCreateIntent } from "@/lib/mobile/use-create-intent";
import { usePagedList } from "@/lib/mobile/use-paged-list";
import { useResource } from "@/lib/mobile/use-resource";
import { CRM_PERMISSIONS, CRM_TASK_STATUSES, type CrmTask, type CrmTaskStatus } from "@/types/crm";

type TaskView = "list" | "board";
type StatusFilter = CrmTaskStatus | "all";
type TaskSort = "due" | "title" | "status";

const TASK_SORTS: { value: TaskSort; label: string }[] = [
  { value: "due", label: "Due date" },
  { value: "title", label: "Title" },
  { value: "status", label: "Status" },
];

const VIEW_OPTIONS: ChipOption<TaskView>[] = [
  { value: "list", label: "List" },
  { value: "board", label: "Board" },
];

const STATUS_FILTERS: ChipOption<StatusFilter>[] = [
  { value: "all", label: "All" },
  ...CRM_TASK_STATUSES.map((status) => ({ value: status, label: humanize(status) })),
];

function readStatus(value: string | null): StatusFilter {
  if (value && (CRM_TASK_STATUSES as readonly string[]).includes(value)) return value as CrmTaskStatus;
  return "all";
}

export default function Tasks() {
  const { permissions } = useMobile();
  const canRead = permissions.includes(CRM_PERMISSIONS.tasksRead);
  const canCreate = permissions.includes(CRM_PERMISSIONS.tasksCreate);
  const canUpdate = permissions.includes(CRM_PERMISSIONS.tasksUpdate);
  const canDelete = permissions.includes(CRM_PERMISSIONS.tasksDelete);
  const canReadUsers = permissions.includes(CRM_PERMISSIONS.usersRead);
  const canReadContacts = permissions.includes(CRM_PERMISSIONS.contactsRead);
  const canReadEnquiries = permissions.includes(CRM_PERMISSIONS.enquiriesRead);

  const [params, setParams] = useSearchParams();
  const status = readStatus(params.get("status"));
  const setStatus = (next: StatusFilter) => {
    setParams(
      (current) => {
        const updated = new URLSearchParams(current);
        if (next === "all") updated.delete("status");
        else updated.set("status", next);
        return updated;
      },
      { replace: true },
    );
  };
  const [view, setView] = useState<TaskView>("list");
  const [assigneeId, setAssigneeId] = useState("");
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState<TaskSort>("due");
  const [order, setOrder] = useState<SortOrder>("asc");
  const [editing, setEditing] = useState<CrmTask | null>(null);
  const [pendingRemove, setPendingRemove] = useState<CrmTask | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [createOpen, setCreateOpen] = useCreateIntent(canCreate);
  const [today] = useState(() => new Date());

  const load = useCallback(
    (page: number) =>
      listTasks({
        page,
        limit: 20,
        status: status === "all" ? undefined : status,
        assigneeId: assigneeId || undefined,
      }),
    [status, assigneeId],
  );
  const list = usePagedList(load, `${status}|${assigneeId}`, canRead);

  const loadUsers = useCallback(() => listCrmUsers({ page: 1, limit: 50 }), []);
  const users = useResource(loadUsers, canRead && canReadUsers);
  const loadContacts = useCallback(() => listContacts({ page: 1, limit: 50 }), []);
  const contacts = useResource(loadContacts, canRead && canReadContacts);
  const loadEnquiries = useCallback(() => listEnquiries({ page: 1, limit: 50, status: "open" }), []);
  const enquiries = useResource(loadEnquiries, canRead && canReadEnquiries);

  const assigneeOptions: TaskLinkOption[] = useMemo(
    () =>
      (users.data?.items ?? []).map((user) => ({
        id: user.id,
        label: `${user.firstName} ${user.lastName}`.trim() || user.email,
      })),
    [users.data],
  );
  const contactOptions: TaskLinkOption[] = useMemo(
    () => (contacts.data?.items ?? []).map((contact) => ({ id: contact.id, label: personLine(contact.name, contact.mobile) })),
    [contacts.data],
  );
  const enquiryOptions: TaskLinkOption[] = useMemo(
    () => (enquiries.data?.items ?? []).map((enquiry) => ({ id: enquiry.id, label: enquiry.title })),
    [enquiries.data],
  );

  const labelFor = (options: TaskLinkOption[], id: string | null) =>
    id ? (options.find((option) => option.id === id)?.label ?? null) : null;

  const visible = useMemo(() => {
    const filtered = list.items.filter((task) =>
      matchesQuery(
        query,
        task.title,
        task.description,
        task.status,
        humanize(task.status),
        labelFor(assigneeOptions, task.assigneeId),
        labelFor(contactOptions, task.contactId),
        labelFor(enquiryOptions, task.enquiryId),
      ),
    );
    return [...filtered].sort((left, right) => {
      if (sort === "title") return compareText(left.title, right.title, order);
      if (sort === "status") return compareText(left.status, right.status, order);
      return compareTime(left.dueAt, right.dueAt, order);
    });
  }, [assigneeOptions, contactOptions, enquiryOptions, list.items, order, query, sort]);
  const filterSections: FilterSection[] = [
    {
      id: "task-status",
      kind: "single",
      label: "Status",
      value: status,
      neutral: "all",
      options: STATUS_FILTERS,
      onChange: (nextStatus) => setStatus(nextStatus as StatusFilter),
    },
  ];
  if (canReadUsers && assigneeOptions.length > 0) {
    filterSections.push({
      id: "task-assignee",
      kind: "single",
      label: "Assignee",
      value: assigneeId,
      neutral: "",
      options: [{ value: "", label: "Everyone" }, ...assigneeOptions.map((option) => ({ value: option.id, label: option.label }))],
      onChange: setAssigneeId,
    });
  }

  const move = async (task: CrmTask, next: CrmTaskStatus) => {
    if (next === task.status) return;
    setBusyId(task.id);
    try {
      await updateTaskStatus(task.id, next);
      toast.success(`Moved to ${humanize(next)}`);
      list.reload();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to move task");
    } finally {
      setBusyId(null);
    }
  };

  const remove = async () => {
    if (!pendingRemove) return;
    setBusyId(pendingRemove.id);
    try {
      await removeTask(pendingRemove.id);
      toast.success("Task removed");
      setPendingRemove(null);
      list.reload();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to remove task");
    } finally {
      setBusyId(null);
    }
  };

  if (!canRead) return <ForbiddenState label="tasks" />;

  const renderTask = (task: CrmTask) => {
    const detail = [
      labelFor(assigneeOptions, task.assigneeId),
      labelFor(contactOptions, task.contactId),
      labelFor(enquiryOptions, task.enquiryId),
    ]
      .filter(Boolean)
      .join(" · ");
    return (
      <ListRow
        key={task.id}
        title={task.title}
        detail={detail || task.description || null}
        value={task.dueAt ? formatDateTime(task.dueAt) : "No due date"}
        badge={
          <Badge variant={task.status === "done" ? "secondary" : "default"} className="rounded-lg text-[10px]">
            {humanize(task.status)}
          </Badge>
        }
        onClick={canUpdate ? () => setEditing(task) : undefined}
        footer={
          canUpdate || canDelete ? (
            <div className="flex flex-wrap items-center gap-2">
              {canUpdate ? (
                <>
                  <Label htmlFor={`task-move-${task.id}`} className="sr-only">
                    Move {task.title}
                  </Label>
                  <NativeSelect
                    id={`task-move-${task.id}`}
                    value={task.status}
                    disabled={busyId === task.id}
                    onChange={(next) => void move(task, next as CrmTaskStatus)}
                    className="h-9 w-auto flex-1 text-sm"
                  >
                    {CRM_TASK_STATUSES.map((option) => (
                      <option key={option} value={option}>
                        {humanize(option)}
                      </option>
                    ))}
                  </NativeSelect>
                </>
              ) : null}
              {canDelete ? (
                <Button
                  type="button"
                  variant="ghost"
                  className="h-9 rounded-xl text-destructive"
                  onClick={() => setPendingRemove(task)}
                >
                  Remove
                </Button>
              ) : null}
            </div>
          ) : undefined
        }
      />
    );
  };

  return (
    <div className="space-y-3">
      <FilterSortBar
        views={<ViewSwitch options={VIEW_OPTIONS} value={view} onChange={setView} label="Task view" />}
        query={query}
        onQuery={setQuery}
        searchPlaceholder="Search loaded tasks"
        searchLabel="Search tasks"
        sort={sort}
        onSort={(next) => setSort(next as TaskSort)}
        sortOptions={TASK_SORTS}
        defaultSort="due"
        order={order}
        onOrder={setOrder}
        defaultOrder="asc"
        sections={filterSections}
        resultCount={visible.length}
        singular="task"
        plural="tasks"
        onClear={() => {
          setStatus("all");
          setAssigneeId("");
        }}
        onAdd={canCreate ? () => setCreateOpen(true) : undefined}
        addLabel="New task"
      />

      {pendingRemove ? (
        <ConfirmInline
          message={`Remove the task “${pendingRemove.title}”?`}
          busy={busyId === pendingRemove.id}
          onCancel={() => setPendingRemove(null)}
          onConfirm={() => void remove()}
        />
      ) : null}

      {list.status === "loading" ? <LoadingState label="Loading tasks…" /> : null}
      {list.status === "error" ? <ErrorState message={list.errorMessage} onRetry={list.reload} /> : null}
      {list.status === "forbidden" ? <ForbiddenState label="tasks" /> : null}
      {list.status === "ready" && visible.length === 0 ? <EmptyState label="No tasks found." /> : null}

      {list.status === "ready" && visible.length > 0 && view === "list" ? (
        <div className="space-y-2">{visible.map(renderTask)}</div>
      ) : null}

      {list.status === "ready" && visible.length > 0 && view === "board" ? (
        <div className="flex snap-x gap-3 overflow-x-auto pb-2">
          {CRM_TASK_STATUSES.map((column) => {
            const items = visible.filter((task) => task.status === column);
            return (
              <section key={column} aria-label={humanize(column)} className="w-64 shrink-0 snap-start space-y-2">
                <h3 className="flex items-center justify-between text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  <span>{humanize(column)}</span>
                  <span className="tabular-nums">{items.length}</span>
                </h3>
                {items.length === 0 ? (
                  <p className="rounded-2xl border border-dashed border-border px-4 py-3 text-xs text-muted-foreground">
                    Nothing here.
                  </p>
                ) : (
                  <div className="space-y-2">{items.map(renderTask)}</div>
                )}
              </section>
            );
          })}
        </div>
      ) : null}

      {list.status === "ready" ? (
        <LoadMore hasMore={list.hasMore} loading={list.loadingMore} onLoadMore={list.loadMore} />
      ) : null}

      <CreateTaskSheet
        open={createOpen || Boolean(editing)}
        onOpenChange={(next) => {
          if (next) return;
          setCreateOpen(false);
          setEditing(null);
        }}
        day={today}
        task={editing}
        assignees={assigneeOptions}
        contacts={contactOptions}
        enquiries={enquiryOptions}
        onCreated={list.reload}
      />
    </div>
  );
}
