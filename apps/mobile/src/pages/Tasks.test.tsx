/** @vitest-environment jsdom */
import { beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, screen, waitFor } from "@testing-library/react";
import Tasks from "@/pages/Tasks";
import { pageOf } from "@/test/fixtures";
import { renderMobile } from "@/test/render-mobile";
import { CRM_PERMISSIONS, type CrmTask } from "@/types/crm";

const state = vi.hoisted(() => ({ permissions: [] as string[] }));
const remote = vi.hoisted(() => ({
  listTasks: vi.fn(),
  listCrmUsers: vi.fn(),
  listContacts: vi.fn(),
  listEnquiries: vi.fn(),
  createTask: vi.fn(),
  updateTask: vi.fn(),
  updateTaskStatus: vi.fn(),
  removeTask: vi.fn(),
}));

vi.mock("@/lib/mobile/store", () => ({ useMobile: () => ({ permissions: state.permissions }) }));
vi.mock("@/lib/mobile/remote", () => remote);

const task: CrmTask = {
  id: "t1",
  title: "Call the florist",
  description: null,
  status: "todo",
  assigneeId: null,
  dueAt: null,
  contactId: null,
  enquiryId: null,
};

beforeEach(() => {
  vi.clearAllMocks();
  state.permissions = [
    CRM_PERMISSIONS.tasksRead,
    CRM_PERMISSIONS.tasksCreate,
    CRM_PERMISSIONS.tasksUpdate,
    CRM_PERMISSIONS.tasksDelete,
  ];
  remote.listTasks.mockResolvedValue(pageOf([task]));
  remote.listCrmUsers.mockResolvedValue(pageOf([]));
  remote.listContacts.mockResolvedValue(pageOf([]));
  remote.listEnquiries.mockResolvedValue(pageOf([]));
  remote.updateTaskStatus.mockResolvedValue({ ...task, status: "done" });
  remote.removeTask.mockResolvedValue(undefined);
});

describe("tasks", () => {
  it("is forbidden without crm.tasks.read", () => {
    state.permissions = [];
    renderMobile(<Tasks />, ["/tasks"]);
    expect(screen.getByText("Your role cannot view tasks.")).toBeInTheDocument();
    expect(remote.listTasks).not.toHaveBeenCalled();
  });

  it("filters by the status in the URL and moves a task", async () => {
    renderMobile(<Tasks />, ["/tasks?status=todo"]);
    expect(await screen.findByText("Call the florist")).toBeInTheDocument();
    expect(remote.listTasks).toHaveBeenCalledWith(expect.objectContaining({ status: "todo" }));

    fireEvent.change(screen.getByLabelText("Move Call the florist"), { target: { value: "done" } });
    await waitFor(() => expect(remote.updateTaskStatus).toHaveBeenCalledWith("t1", "done"));
  });

  it("asks before removing a task", async () => {
    renderMobile(<Tasks />, ["/tasks"]);
    fireEvent.click(await screen.findByRole("button", { name: "Remove" }));
    expect(screen.getByRole("alertdialog")).toHaveTextContent("Call the florist");
    expect(remote.removeTask).not.toHaveBeenCalled();
  });

  it("rejects a task without a title", async () => {
    renderMobile(<Tasks />, ["/tasks?new=1"]);
    fireEvent.click(await screen.findByRole("button", { name: "Create task" }));
    expect(await screen.findByText("Title is required (160 characters max)")).toBeInTheDocument();
    expect(remote.createTask).not.toHaveBeenCalled();
  });

  it("offers a retry when the list fails", async () => {
    remote.listTasks.mockRejectedValue(new Error("Network down"));
    renderMobile(<Tasks />, ["/tasks"]);
    expect(await screen.findByText("Network down")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Try again" })).toBeInTheDocument();
  });
});
