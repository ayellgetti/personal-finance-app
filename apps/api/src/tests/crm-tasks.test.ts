import assert from "node:assert/strict";
import test from "node:test";
import { TaskService } from "../modules/sales-crm/tasks/task.service";
import { updateTaskStatusBodySchema } from "../modules/sales-crm/tasks/task.request";
import type {
  CrmContactModel,
  CrmEnquiryModel,
  CrmTaskModel,
} from "../models/index";
import { fakeCrud } from "./crm-test-utils";

function setup() {
  const tasks = fakeCrud("task", []);
  const contacts = fakeCrud("contact", []);
  const enquiries = fakeCrud("enquiry", []);
  const service = new TaskService(
    tasks.model as unknown as CrmTaskModel,
    contacts.model as unknown as CrmContactModel,
    enquiries.model as unknown as CrmEnquiryModel,
  );
  return { service, tasks };
}

test("task create, list by status, status patch, and soft-delete hide the row", async () => {
  const { service } = setup();
  const created = await service.create("user-1", {
    title: "Prepare quote",
    status: "todo",
  });
  assert.equal(created.status, "todo");
  const listed = await service.list({ status: "todo" });
  assert.equal(listed.items.length, 1);
  const moved = await service.updateStatus("user-1", created.id, { status: "in_progress" });
  assert.equal(moved.status, "in_progress");
  await service.remove("user-1", { id: created.id });
  assert.equal((await service.list({})).items.length, 0);
});

test("task status body rejects unknown values", () => {
  assert.equal(updateTaskStatusBodySchema.safeParse({ status: "blocked" }).success, false);
  assert.equal(updateTaskStatusBodySchema.safeParse({ status: "done" }).success, true);
});
