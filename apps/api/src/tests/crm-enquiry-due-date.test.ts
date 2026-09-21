import assert from "node:assert/strict";
import test from "node:test";
import {
  endOfLocalDay,
  isFollowUpOverdue,
  isOnOrAfterLocalDay,
} from "../modules/sales-crm/enquiries/enquiry-due-date";

test("endOfLocalDay keeps the calendar day and sets the last millisecond", () => {
  const from = new Date(2026, 8, 17, 10, 0, 0);
  const end = endOfLocalDay(from);
  assert.equal(end.getFullYear(), 2026);
  assert.equal(end.getMonth(), 8);
  assert.equal(end.getDate(), 17);
  assert.equal(end.getHours(), 23);
  assert.equal(end.getMinutes(), 59);
  assert.equal(end.getSeconds(), 59);
  assert.equal(end.getMilliseconds(), 999);
});

test("isOnOrAfterLocalDay treats today as allowed and rejects earlier days", () => {
  const now = new Date(2026, 8, 21, 15, 0, 0);
  assert.equal(isOnOrAfterLocalDay(new Date(2026, 8, 21, 0, 0, 0), now), true);
  assert.equal(isOnOrAfterLocalDay(new Date(2026, 8, 22, 8, 0, 0), now), true);
  assert.equal(isOnOrAfterLocalDay(new Date(2026, 8, 20, 23, 59, 59), now), false);
});

test("isFollowUpOverdue is true only when next date passed and enquiry is open", () => {
  const now = new Date("2026-09-17T12:00:00.000Z");
  assert.equal(
    isFollowUpOverdue({
      nextFollowupDate: new Date("2026-09-10T10:00:00.000Z"),
      enquiryStatus: "contacted",
      now,
    }),
    true,
  );
  assert.equal(
    isFollowUpOverdue({
      nextFollowupDate: new Date("2026-09-10T10:00:00.000Z"),
      enquiryStatus: "closed",
      now,
    }),
    false,
  );
  assert.equal(
    isFollowUpOverdue({
      nextFollowupDate: new Date("2026-09-20T10:00:00.000Z"),
      enquiryStatus: "new",
      now,
    }),
    false,
  );
});
