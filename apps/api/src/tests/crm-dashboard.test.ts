import assert from "node:assert/strict";
import test from "node:test";
import { DashboardService } from "../modules/sales-crm/dashboard/dashboard.service";
import type {
  CrmContactModel,
  CrmEnquiryModel,
  CrmFollowUpModel,
  CrmPaymentModel,
  CrmTaskModel,
} from "../models/index";
import { fakeCrud } from "./crm-test-utils";

test("dashboard cards count contacts, enquiries, overdue follow-ups, paid-this-month, and tasks", async () => {
  const now = new Date("2026-09-15T12:00:00.000Z");
  const contacts = fakeCrud("contact", [
    { id: "c-1", type: "lead", isActive: 1 },
    { id: "c-2", type: "lead", isActive: 1 },
    { id: "c-3", type: "client", isActive: 1 },
    { id: "c-gone", type: "lead", isActive: 0 },
  ]);
  const enquiries = fakeCrud("enquiry", [
    { id: "e-1", status: "new", isActive: 1 },
    { id: "e-2", status: "won", isActive: 1 },
    { id: "e-3", status: "lost", isActive: 1 },
    { id: "e-4", status: "on_hold", isActive: 1 },
  ]);
  const followUps = fakeCrud("followup", [
    {
      id: "f-1",
      status: "pending",
      dueAt: new Date("2026-09-01T00:00:00.000Z"),
      isActive: 1,
    },
    {
      id: "f-2",
      status: "pending",
      dueAt: new Date("2026-09-20T00:00:00.000Z"),
      isActive: 1,
    },
  ]);
  const payments = fakeCrud("payment", [
    {
      id: "p-1",
      status: "paid",
      amount: 100,
      paidAt: new Date("2026-09-02T00:00:00.000Z"),
      isActive: 1,
    },
    {
      id: "p-2",
      status: "paid",
      amount: 50,
      paidAt: new Date("2026-08-02T00:00:00.000Z"),
      isActive: 1,
    },
    {
      id: "p-3",
      status: "pending",
      amount: 999,
      paidAt: new Date("2026-09-02T00:00:00.000Z"),
      isActive: 1,
    },
  ]);
  const tasks = fakeCrud("task", [
    { id: "t-1", status: "todo", isActive: 1 },
    { id: "t-2", status: "done", isActive: 1 },
    { id: "t-3", status: "done", isActive: 1 },
  ]);
  const service = new DashboardService(
    contacts.model as unknown as CrmContactModel,
    enquiries.model as unknown as CrmEnquiryModel,
    followUps.model as unknown as CrmFollowUpModel,
    payments.model as unknown as CrmPaymentModel,
    tasks.model as unknown as CrmTaskModel,
  );

  const snapshot = await service.get(now);
  assert.equal(snapshot.contactsByType.lead, 2);
  assert.equal(snapshot.contactsByType.client, 1);
  assert.equal(snapshot.enquiries.open, 2);
  assert.equal(snapshot.enquiries.won, 1);
  assert.equal(snapshot.enquiries.lost, 1);
  assert.equal(snapshot.overdueFollowUps, 1);
  assert.equal(snapshot.paymentsPaidThisMonth, 100);
  assert.equal(snapshot.tasksByStatus.todo, 1);
  assert.equal(snapshot.tasksByStatus.done, 2);
});
