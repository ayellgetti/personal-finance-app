import assert from "node:assert/strict";
import { createServer, type Server } from "node:http";
import { after, afterEach, before, beforeEach, describe, mock, test } from "node:test";
import type {
  CrmCalendarEvent,
  CrmClient,
  CrmContact,
  CrmEnquiry,
  CrmPayment,
  CrmTask,
} from "@prisma/client";
import { app } from "../config/app";
import {
  crmCalendarEventModel,
  crmClientModel,
  crmContactModel,
  crmEnquiryModel,
  crmPaymentModel,
  crmTaskModel,
} from "../models/index";
import { calendarService } from "../modules/sales-crm/calendar/calendar.service";
import { enquiryService } from "../modules/sales-crm/enquiries/enquiry.service";
import { roleService } from "../modules/sales-crm/roles/role.service";
import { rbacService } from "../modules/sales-crm/rbac/rbac.service";
import { crmUserService } from "../modules/sales-crm/users/user.service";
import { MAX_CALENDAR_RANGE_MS } from "../modules/sales-crm/crm.util";
import { failureLogService } from "../modules/shared/logging/failure-log.service";
import { jwtUtil } from "../utils/jwt.util";
import { prisma } from "../utils/prisma.util";

/**
 * HTTP coverage for authenticated CRM routes on the shared Express app.
 * Access tokens are signed with the real JWT helper. Permission lookups,
 * model reads, and failure-log writes are stubbed so these tests never open
 * a database connection. The first-time convert write still uses
 * prisma.$transaction and stays covered by the in-memory enquiry service tests.
 */

const STAFF = {
  id: "11111111-1111-4111-8111-111111111111",
  email: "staff@example.com",
};
const ENQUIRY_ID = "22222222-2222-4222-8222-222222222222";
const CONTACT_ID = "33333333-3333-4333-8333-333333333333";
const CLIENT_ID = "44444444-4444-4444-8444-444444444444";
const EVENT_ID = "55555555-5555-4555-8555-555555555555";

type Envelope = {
  code: number;
  success: boolean;
  data: unknown;
  message: string;
  timestamp: string;
  requestId: string;
};

function accessToken(user = STAFF): string {
  return jwtUtil.signAccessToken(user);
}

function grant(codes: readonly string[]) {
  return mock.method(rbacService, "listPermissionCodesForUser", async () => [...codes]);
}

let restoreTransaction: (() => void) | undefined;

function blockTransactions() {
  const original = prisma.$transaction;
  let calls = 0;
  // Prisma's client proxy does not expose $transaction as a mockable method.
  prisma.$transaction = (async () => {
    calls += 1;
    throw new Error("database transaction was not expected");
  }) as typeof prisma.$transaction;
  restoreTransaction = () => {
    prisma.$transaction = original;
  };
  return {
    get callCount() {
      return calls;
    },
  };
}

function instant(value: unknown): number {
  if (value instanceof Date) {
    return value.getTime();
  }
  return new Date(String(value)).getTime();
}

function passthrough<Args extends readonly unknown[], Result>(
  fn: (...args: Args) => Result,
): (...args: Args) => Result {
  return (...args) => fn(...args);
}

function enquiryFixture(status: CrmEnquiry["status"]): CrmEnquiry {
  return {
    id: ENQUIRY_ID,
    contactId: CONTACT_ID,
    title: "Wedding",
    status,
    closedReason: status === "closed" ? "Booked" : null,
    isActive: 1,
  } as CrmEnquiry;
}

function contactFixture(): CrmContact {
  return {
    id: CONTACT_ID,
    name: "Ada Lovelace",
    type: "client",
    isActive: 1,
  } as CrmContact;
}

function clientFixture(): CrmClient {
  return {
    id: CLIENT_ID,
    contactId: CONTACT_ID,
    billingName: "Ada LLC",
    isActive: 1,
  } as CrmClient;
}

function eventFixture(): CrmCalendarEvent {
  return {
    id: EVENT_ID,
    enquiryId: ENQUIRY_ID,
    contactId: CONTACT_ID,
    title: "Wedding",
    isActive: 1,
    startsAt: new Date("2026-12-12T10:30:00.000Z"),
    endsAt: new Date("2026-12-12T17:30:00.000Z"),
  } as CrmCalendarEvent;
}

function assertEnvelope(
  response: Response,
  body: Envelope,
  status: number,
  success: boolean,
  message: string,
  requestId: string,
) {
  assert.equal(response.status, status);
  assert.equal(response.headers.get("x-request-id"), requestId);
  assert.equal(body.code, status);
  assert.equal(body.success, success);
  assert.equal(body.message, message);
  assert.equal(body.requestId, requestId);
  assert.equal(typeof body.timestamp, "string");
  assert.equal(Number.isNaN(Date.parse(body.timestamp)), false);
}

describe("authenticated CRM HTTP contracts", { concurrency: false }, () => {
  let baseUrl = "";
  const server: Server = createServer(app.express);

  before(async () => {
    await new Promise<void>((resolve) => {
      server.listen(0, "127.0.0.1", () => resolve());
    });
    const address = server.address();
    assert(address && typeof address !== "string");
    baseUrl = `http://127.0.0.1:${address.port}`;
  });

  after(async () => {
    await new Promise<void>((resolve, reject) => {
      server.close((error) => {
        if (error) {
          reject(error);
          return;
        }
        resolve();
      });
    });
  });

  beforeEach(() => {
    mock.method(failureLogService, "record", async () => undefined);
  });

  afterEach(() => {
    restoreTransaction?.();
    restoreTransaction = undefined;
    mock.restoreAll();
  });

  async function send(
    path: string,
    init: RequestInit = {},
    requestId = "crm-http",
    token = accessToken(),
  ) {
    const headers = new Headers(init.headers);
    headers.set("authorization", `Bearer ${token}`);
    headers.set("x-request-id", requestId);
    if (init.body !== undefined) {
      headers.set("content-type", "application/json");
    }
    const response = await fetch(`${baseUrl}${path}`, { ...init, headers });
    const body = (await response.json()) as Envelope;
    return { response, body };
  }

  test("enquiry list returns the success envelope and validated pagination", async () => {
    const requestId = "crm-http-enquiries";
    grant(["crm.enquiries.read"]);
    const enquiry = { id: ENQUIRY_ID, title: "Wedding" };
    mock.method(crmEnquiryModel, "read", async () => [enquiry] as CrmEnquiry[]);
    mock.method(crmEnquiryModel, "count", async () => 3);
    const paginate = crmEnquiryModel.paginate.bind(crmEnquiryModel);
    const list = mock.method(crmEnquiryModel, "paginate", passthrough(paginate));

    const { response, body } = await send(
      "/api/crm/enquiries?page=2&limit=1",
      {},
      requestId,
    );

    assertEnvelope(response, body, 200, true, "Enquiries retrieved", requestId);
    const data = body.data as {
      items: Array<{ id: string; title: string }>;
      pagination: {
        total: number;
        page: number;
        limit: number;
        totalPages: number;
        hasNextPage: boolean;
        hasPreviousPage: boolean;
      };
    };
    assert.deepEqual(data.items, [enquiry]);
    assert.deepEqual(data.pagination, {
      total: 3,
      page: 2,
      limit: 1,
      totalPages: 3,
      hasNextPage: true,
      hasPreviousPage: true,
    });
    const call = list.mock.calls[0];
    assert.ok(call);
    assert.deepEqual(call.arguments[0], { isActive: 1 });
    assert.equal(Number(call.arguments[1]), 2);
    assert.equal(Number(call.arguments[2]), 1);
    assert.deepEqual(call.arguments[3], { orderBy: { createdAt: "desc" } });
  });

  test("missing permissions return 403 before enquiry, user, or role handlers run", async () => {
    const requestId = "crm-http-forbidden";
    const permissions = grant(["crm.contacts.read"]);
    const listEnquiries = mock.method(crmEnquiryModel, "paginate", async () => {
      throw new Error("enquiry list ran without permission");
    });
    const listUsers = mock.method(crmUserService, "list", async () => {
      throw new Error("user list ran without permission");
    });
    const listRoles = mock.method(roleService, "listRoles", async () => {
      throw new Error("role list ran without permission");
    });

    const paths = ["/api/crm/enquiries", "/api/crm/users", "/api/crm/roles"];
    for (const path of paths) {
      const { response, body } = await send(path, {}, requestId);
      assertEnvelope(response, body, 403, false, "Forbidden", requestId);
    }

    assert.equal(permissions.mock.calls.length, paths.length);
    for (const call of permissions.mock.calls) {
      assert.deepEqual(call.arguments, [STAFF.id]);
    }
    assert.equal(listEnquiries.mock.calls.length, 0);
    assert.equal(listUsers.mock.calls.length, 0);
    assert.equal(listRoles.mock.calls.length, 0);
  });

  test("an invalid access token is rejected before permissions are loaded", async () => {
    const requestId = "crm-http-invalid-token";
    const permissions = mock.method(rbacService, "listPermissionCodesForUser", async () => {
      throw new Error("permission lookup ran for an invalid token");
    });

    const { response, body } = await send(
      "/api/crm/enquiries",
      {},
      requestId,
      "not-a-token",
    );

    assertEnvelope(
      response,
      body,
      401,
      false,
      "Invalid or expired access token",
      requestId,
    );
    assert.equal(permissions.mock.calls.length, 0);
  });

  test("convert of an open enquiry requires a start and does not open a transaction", async () => {
    const requestId = "crm-http-convert-required";
    grant(["crm.enquiries.convert"]);
    mock.method(crmEnquiryModel, "readOne", async () => enquiryFixture("new"));
    mock.method(crmContactModel, "readOne", async () => contactFixture());
    mock.method(crmClientModel, "findOne", async () => null);
    mock.method(crmCalendarEventModel, "findOne", async () => null);
    const transaction = blockTransactions();
    const convert = enquiryService.convert.bind(enquiryService);
    const delegated = mock.method(enquiryService, "convert", passthrough(convert));

    const { response, body } = await send(
      `/api/crm/enquiries/${ENQUIRY_ID}/convert`,
      { method: "POST", body: "{}" },
      requestId,
    );

    assertEnvelope(response, body, 422, false, "Event start datetime is required", requestId);
    const call = delegated.mock.calls[0];
    assert.ok(call);
    assert.deepEqual(call.arguments, [STAFF.id, ENQUIRY_ID, {}]);
    assert.equal(transaction.callCount, 0);
  });

  test("convert of an already booked enquiry repeats the same booking without a transaction", async () => {
    const requestId = "crm-http-convert-idempotent";
    grant(["crm.enquiries.convert"]);
    mock.method(crmEnquiryModel, "readOne", async () => enquiryFixture("closed"));
    mock.method(crmContactModel, "readOne", async () => contactFixture());
    mock.method(crmClientModel, "findOne", async () => clientFixture());
    mock.method(crmCalendarEventModel, "findOne", async () => eventFixture());
    const writes = mock.method(crmEnquiryModel, "update", async () => {
      throw new Error("enquiry update was not expected");
    });
    const transaction = blockTransactions();
    const convert = enquiryService.convert.bind(enquiryService);
    const delegated = mock.method(enquiryService, "convert", passthrough(convert));

    const first = await send(
      `/api/crm/enquiries/${ENQUIRY_ID}/convert`,
      { method: "POST", body: "{}" },
      requestId,
    );
    const second = await send(
      `/api/crm/enquiries/${ENQUIRY_ID}/convert`,
      { method: "POST", body: "{}" },
      requestId,
    );

    assertEnvelope(first.response, first.body, 200, true, "Enquiry converted", requestId);
    assertEnvelope(second.response, second.body, 200, true, "Enquiry converted", requestId);
    assert.deepEqual(first.body.data, second.body.data);
    const data = first.body.data as {
      enquiry: { id: string; status: string };
      contact: { id: string };
      client: { id: string };
      event: { id: string };
    };
    assert.equal(data.enquiry.id, ENQUIRY_ID);
    assert.equal(data.enquiry.status, "closed");
    assert.equal(data.contact.id, CONTACT_ID);
    assert.equal(data.client.id, CLIENT_ID);
    assert.equal(data.event.id, EVENT_ID);
    assert.equal(delegated.mock.calls.length, 2);
    for (const call of delegated.mock.calls) {
      assert.deepEqual(call.arguments, [STAFF.id, ENQUIRY_ID, {}]);
    }
    assert.equal(writes.mock.calls.length, 0);
    assert.equal(transaction.callCount, 0);
  });

  test("a booked enquiry with a paid payment cannot be removed", async () => {
    const requestId = "crm-http-delete-guard";
    grant(["crm.enquiries.delete"]);
    mock.method(crmEnquiryModel, "readOne", async () => enquiryFixture("closed"));
    mock.method(crmClientModel, "findOne", async () => clientFixture());
    mock.method(crmCalendarEventModel, "findOne", async () => eventFixture());
    mock.method(crmPaymentModel, "findOne", async () => ({ id: "pay-1", status: "paid", isActive: 1 }) as CrmPayment);
    const enquiryUpdate = mock.method(crmEnquiryModel, "update", async () => {
      throw new Error("enquiry update was not expected");
    });
    const eventUpdate = mock.method(crmCalendarEventModel, "updateMany", async () => {
      throw new Error("event update was not expected");
    });
    const remove = enquiryService.remove.bind(enquiryService);
    const delegated = mock.method(enquiryService, "remove", passthrough(remove));

    const { response, body } = await send(
      "/api/crm/enquiries/remove",
      { method: "POST", body: JSON.stringify({ id: ENQUIRY_ID }) },
      requestId,
    );

    assertEnvelope(
      response,
      body,
      409,
      false,
      "Cannot remove a booked enquiry after payment has been made",
      requestId,
    );
    const call = delegated.mock.calls[0];
    assert.ok(call);
    assert.deepEqual(call.arguments, [STAFF.id, { id: ENQUIRY_ID }]);
    assert.equal(enquiryUpdate.mock.calls.length, 0);
    assert.equal(eventUpdate.mock.calls.length, 0);
  });

  test("calendar feed rejects a range over 92 days and accepts the maximum range", async () => {
    const requestId = "crm-http-calendar";
    grant(["crm.calendar.read"]);
    const tasks = mock.method(crmTaskModel, "read", async () => [] as CrmTask[]);
    mock.method(crmCalendarEventModel, "read", async () => [] as CrmCalendarEvent[]);
    mock.method(crmEnquiryModel, "read", async () => [] as CrmEnquiry[]);
    const feed = calendarService.feed.bind(calendarService);
    const delegated = mock.method(calendarService, "feed", passthrough(feed));
    const from = new Date("2026-01-01T00:00:00.000Z");
    const maximum = new Date(from.getTime() + MAX_CALENDAR_RANGE_MS);
    const over = new Date(maximum.getTime() + 1);
    const query = (to: Date) =>
      `/api/crm/calendar?from=${encodeURIComponent(from.toISOString())}&to=${encodeURIComponent(to.toISOString())}`;

    const rejected = await send(query(over), {}, requestId);
    assertEnvelope(rejected.response, rejected.body, 422, false, "Validation failed", requestId);
    assert.match(JSON.stringify(rejected.body.data), /Calendar range cannot exceed 92 days/);
    assert.equal(delegated.mock.calls.length, 0);
    assert.equal(tasks.mock.calls.length, 0);

    const accepted = await send(query(maximum), {}, requestId);
    assertEnvelope(accepted.response, accepted.body, 200, true, "Calendar retrieved", requestId);
    assert.deepEqual(accepted.body.data, { items: [] });
    const call = delegated.mock.calls[0];
    assert.ok(call);
    const range = call.arguments[0] as { from: unknown; to: unknown };
    assert.equal(instant(range.from), from.getTime());
    assert.equal(instant(range.to), maximum.getTime());
    assert.equal(instant(range.to) - instant(range.from), MAX_CALENDAR_RANGE_MS);
    assert.ok(tasks.mock.calls.length > 0);
  });
});
