import assert from "node:assert/strict";
import test from "node:test";
import { DashboardService } from "../modules/sales-crm/dashboard/dashboard.service";
import type {
  CrmContactModel,
  CrmEnquiryModel,
  CrmPaymentModel,
  CrmTaskModel,
} from "../models/index";
import { fakeCrud } from "./crm-test-utils";

test("dashboard cards count contacts, enquiries, overdue follow-ups, paid-this-month, and tasks", async () => {
  const now = new Date(2026, 8, 15, 12, 0, 0);
  const contacts = fakeCrud("contact", [
    { id: "c-1", type: "lead", isActive: 1 },
    { id: "c-2", type: "lead", isActive: 1 },
    { id: "c-3", type: "client", isActive: 1 },
    { id: "c-gone", type: "lead", isActive: 0 },
  ]);
  const enquiries = fakeCrud("enquiry", [
    {
      id: "e-1",
      title: "New today",
      contactId: "c-1",
      status: "new",
      createdAt: new Date(2026, 8, 15, 8, 0, 0),
      dueDate: new Date(2026, 8, 15, 23, 59, 59),
      nextFollowupDate: null,
      isActive: 1,
    },
    {
      id: "e-2",
      title: "Closed",
      contactId: "c-2",
      status: "closed",
      createdAt: new Date(2026, 8, 1, 8, 0, 0),
      dueDate: null,
      nextFollowupDate: new Date(2026, 8, 1, 0, 0, 0),
      isActive: 1,
    },
    {
      id: "e-3",
      title: "Closed old",
      contactId: "c-2",
      status: "closed",
      createdAt: new Date(2026, 8, 2, 8, 0, 0),
      dueDate: null,
      nextFollowupDate: null,
      isActive: 1,
    },
    {
      id: "e-4",
      title: "Overdue open",
      contactId: "c-3",
      status: "negotiation",
      createdAt: new Date(2026, 8, 1, 8, 0, 0),
      dueDate: new Date(2026, 8, 10, 23, 59, 59),
      nextFollowupDate: new Date(2026, 8, 1, 0, 0, 0),
      isActive: 1,
    },
    {
      id: "e-5",
      title: "Follow-up today",
      contactId: "c-1",
      status: "contacted",
      createdAt: new Date(2026, 8, 10, 8, 0, 0),
      dueDate: new Date(2026, 8, 20, 23, 59, 59),
      nextFollowupDate: new Date(2026, 8, 15, 15, 0, 0),
      isActive: 1,
    },
  ]);
  const payments = fakeCrud("payment", [
    {
      id: "p-1",
      status: "paid",
      type: "INCOME",
      amount: 100,
      paidAt: new Date(2026, 8, 2, 0, 0, 0),
      isActive: 1,
    },
    {
      id: "p-2",
      status: "paid",
      type: "INCOME",
      amount: 50,
      paidAt: new Date(2026, 7, 2, 0, 0, 0),
      isActive: 1,
    },
    {
      id: "p-3",
      status: "pending",
      type: "INCOME",
      amount: 999,
      paidAt: new Date(2026, 8, 2, 0, 0, 0),
      isActive: 1,
    },
    {
      id: "p-4",
      status: "paid",
      type: "EXPENSE",
      amount: 40,
      paidAt: new Date(2026, 8, 10, 0, 0, 0),
      isActive: 1,
    },
    {
      id: "p-5",
      status: "paid",
      type: "EXPENSE",
      amount: 25,
      paidAt: new Date(2026, 7, 20, 0, 0, 0),
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
    payments.model as unknown as CrmPaymentModel,
    tasks.model as unknown as CrmTaskModel,
  );

  const snapshot = await service.get(now);
  assert.equal(snapshot.contactsByType.lead, 2);
  assert.equal(snapshot.contactsByType.client, 1);
  assert.equal(snapshot.enquiries.open, 3);
  assert.equal(snapshot.enquiries.closed, 2);
  assert.equal(snapshot.leadsGeneratedToday, 1);
  assert.equal(snapshot.customerDueToday, 1);
  assert.equal(snapshot.customerDueItems[0]?.id, "e-1");
  assert.equal(snapshot.overdueFollowUps, 1);
  assert.equal(snapshot.followUpsToday, 1);
  assert.equal(snapshot.paymentsIncomeThisMonth, 100);
  assert.equal(snapshot.paymentsExpenseThisMonth, 40);
  assert.equal(snapshot.paymentsPaidThisMonth, 140);
  assert.equal(snapshot.tasksByStatus.todo, 1);
  assert.equal(snapshot.tasksByStatus.done, 2);
});
