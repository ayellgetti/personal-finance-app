import assert from "node:assert/strict";
import test from "node:test";
import type { CrmMessage, CrmMessageTemplate } from "@prisma/client";
import { HttpError } from "../utils/http-error.util";
import { ChannelDelivererClient } from "../modules/sales-crm/communications/communication.delivery";
import { CommunicationService } from "../modules/sales-crm/communications/communication.service";
import { renderMessage } from "../modules/sales-crm/communications/message.template";
import type {
  CrmContactModel,
  CrmMessageModel,
  CrmMessageTemplateModel,
  UserModel,
  UserRoleModel,
} from "../models/index";
import { fakeCrud } from "./crm-test-utils";

test("message templates replace known placeholders and keep unknown tokens", () => {
  assert.equal(renderMessage("Hello {{ name }}", { name: "Ada" }), "Hello Ada");
  assert.equal(renderMessage("Code {{otp}}", {}), "Code {{otp}}");
  assert.equal(renderMessage("{{company}}", { company: "" }), "");
});

test("development delivery logs email and SMS when providers are not configured", async () => {
  const deliverer = new ChannelDelivererClient(
    { host: undefined, port: 587, secure: false, user: undefined, pass: undefined, from: undefined },
    { accountSid: undefined, authToken: undefined, from: undefined, defaultCountryCode: "+91" },
    false,
  );
  await deliverer.sendEmail({ to: "ada@example.com", subject: "Hi", text: "Body" });
  await deliverer.sendSms({ to: "9876543210", text: "Body" });
});

type ContactRow = {
  id: string;
  name: string;
  mobile: string;
  email: string | null;
  companyName: string | null;
  isActive: number;
};

type UserRow = {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  mobileNo: string;
  isActive: number;
};

type RoleRow = {
  id: string;
  userId: string;
  roleId: string;
  isActive: number;
};

function harness(now = new Date("2026-10-12T04:00:00.000Z")) {
  let clock = now;
  const contacts = fakeCrud<ContactRow>("contact", [
    {
      id: "contact-1",
      name: "Ada",
      mobile: "9876543210",
      email: "ada@example.com",
      companyName: "Analytical",
      isActive: 1,
    },
  ]);
  const users = fakeCrud<UserRow>("user", [
    {
      id: "user-2",
      firstName: "Grace",
      lastName: "Hopper",
      email: "grace@example.com",
      mobileNo: "9000000001",
      isActive: 1,
    },
  ]);
  const roles = fakeCrud<RoleRow>("role", [
    { id: "role-1", userId: "user-1", roleId: "admin", isActive: 1 },
    { id: "role-2", userId: "user-2", roleId: "sales", isActive: 1 },
  ]);
  const templates = fakeCrud<CrmMessageTemplate>("template");
  const messages = fakeCrud<CrmMessage>("message");
  const calls: string[] = [];
  let deliverImpl: {
    sendEmail: () => Promise<void>;
    sendSms: () => Promise<void>;
  } = {
    async sendEmail() {
      calls.push("email");
    },
    async sendSms() {
      calls.push("sms");
    },
  };
  const deliver = {
    sendEmail: () => deliverImpl.sendEmail(),
    sendSms: () => deliverImpl.sendSms(),
  };

  const service = new CommunicationService(
    templates.model as unknown as CrmMessageTemplateModel,
    messages.model as unknown as CrmMessageModel,
    contacts.model as unknown as CrmContactModel,
    {
      findById: async (id: string) => users.rows.find((row) => row.id === id) ?? null,
      read: users.model.read,
    } as unknown as UserModel,
    roles.model as unknown as UserRoleModel,
    deliver,
    () => clock,
  );

  return {
    service,
    templates: templates.rows,
    messages: messages.rows,
    calls,
    setDeliver(next: typeof deliverImpl) {
      deliverImpl = next;
    },
    advance(ms: number) {
      clock = new Date(clock.getTime() + ms);
    },
  };
}

test("template message freezes rendered copy and waits until the schedule", async () => {
  const { service, calls, messages, advance } = harness();
  const template = await service.createTemplate("user-1", {
    name: "Welcome",
    channel: "email",
    subject: "Hello {{name}}",
    body: "Welcome to {{company}}, {{name}}.",
  });

  const scheduled = await service.createMessage("user-1", {
    channel: "email",
    templateId: template.id,
    contactId: "contact-1",
    scheduledAt: new Date("2026-10-12T05:00:00.000Z"),
  });

  assert.equal(scheduled.status, "scheduled");
  assert.equal(scheduled.subject, "Hello Ada");
  assert.equal(scheduled.body, "Welcome to Analytical, Ada.");
  assert.equal(scheduled.toAddress, "ada@example.com");
  assert.equal(calls.length, 0);

  advance(30 * 60 * 1000);
  assert.equal(await service.dispatchDue(), 0);

  advance(31 * 60 * 1000);
  assert.equal(await service.dispatchDue(), 1);
  assert.deepEqual(calls, ["email"]);
  assert.equal(messages[0]?.status, "sent");
  assert.ok(messages[0]?.sentAt);
});

test("on-the-fly SMS sends immediately and a past schedule is rejected", async () => {
  const { service, calls } = harness();
  const sent = await service.createMessage("user-1", {
    channel: "sms",
    contactId: "contact-1",
    body: "Your table is ready, {{name}}.",
    variables: { name: "Ada" },
  });
  assert.equal(sent.status, "sent");
  assert.equal(sent.body, "Your table is ready, Ada.");
  assert.equal(sent.toAddress, "9876543210");
  assert.deepEqual(calls, ["sms"]);

  await assert.rejects(
    () =>
      service.createMessage("user-1", {
        channel: "sms",
        toAddress: "9876543210",
        body: "Too late",
        scheduledAt: new Date("2026-10-11T04:00:00.000Z"),
      }),
    (error: unknown) => error instanceof HttpError && error.status === 400,
  );
});

test("in-app notification is scheduled, then read only by the recipient", async () => {
  const { service } = harness();
  const created = await service.createMessage("user-1", {
    channel: "in_app",
    recipientUserId: "user-2",
    subject: "Follow up {{name}}",
    body: "Call {{name}} today.",
    contactId: "contact-1",
    variables: { name: "Ada" },
    scheduledAt: new Date("2026-10-12T06:00:00.000Z"),
  });
  assert.equal(created.status, "scheduled");
  assert.equal(created.body, "Call Ada today.");

  const cancelled = await service.cancelMessage("user-1", created.id);
  assert.equal(cancelled.status, "cancelled");
  await assert.rejects(
    () => service.cancelMessage("user-1", created.id),
    (error: unknown) => error instanceof HttpError && error.status === 409,
  );

  const sent = await service.createMessage("user-1", {
    channel: "in_app",
    recipientUserId: "user-2",
    subject: "Ping",
    body: "New enquiry",
  });
  assert.equal(sent.status, "sent");

  const mine = await service.inbox("user-2", {});
  assert.equal(mine.items.length, 1);
  assert.equal(mine.items[0]?.read, 0);
  const empty = await service.inbox("user-1", {});
  assert.equal(empty.items.length, 0);

  const read = await service.markRead("user-2", sent.id);
  assert.equal(read.read, 1);
  const unread = await service.inbox("user-2", { unread: "1" });
  assert.equal(unread.items.length, 0);

  await assert.rejects(
    () => service.inbox("user-3", {}),
    (error: unknown) => error instanceof HttpError && error.status === 403,
  );
});

test("failed delivery is stored and a stuck send can be retried", async () => {
  const { service, messages, calls, setDeliver } = harness();
  setDeliver({
    async sendEmail() {
      throw new Error("Email delivery failed");
    },
    async sendSms() {
      throw new Error("unused");
    },
  });

  const failed = await service.createMessage("user-1", {
    channel: "email",
    toAddress: "ada@example.com",
    subject: "Invoice",
    body: "Please find the invoice attached.",
  });
  assert.equal(failed.status, "failed");
  assert.equal(failed.errorMessage, "Email delivery failed");

  const stuck = messages[0];
  assert.ok(stuck);
  stuck.status = "sending";
  stuck.updatedAt = new Date("2026-10-12T03:00:00.000Z");
  calls.length = 0;
  setDeliver({
    async sendEmail() {
      calls.push("retry");
    },
    async sendSms() {
      throw new Error("unused");
    },
  });

  assert.equal(await service.dispatchDue(), 1);
  assert.deepEqual(calls, ["retry"]);
  assert.equal(messages[0]?.status, "sent");
});
