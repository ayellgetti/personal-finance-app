import assert from "node:assert/strict";
import test from "node:test";
import { isFollowUpOverdue, resolveEnquiryDueDate } from "../modules/sales-crm/enquiries/enquiry-due-date";

test("resolveEnquiryDueDate maps each window from the start date", () => {
  const from = new Date("2026-09-17T10:00:00.000Z");
  const seven = resolveEnquiryDueDate("within_7_days", from);
  assert.equal(seven.getDate(), from.getDate() + 7);
  const month = resolveEnquiryDueDate("within_1_month", from);
  assert.equal(month.getMonth(), from.getMonth() + 1);
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
