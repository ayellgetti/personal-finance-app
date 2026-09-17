-- Enquiry customer due-date window plus next follow-up date on enquiry and follow-up history.

CREATE TYPE "CrmEnquiryDueDateWindow" AS ENUM (
  'within_7_days',
  'within_15_days',
  'within_1_month',
  'within_2_months',
  'within_3_months',
  'within_6_months'
);

ALTER TABLE "CrmEnquiry"
  ADD COLUMN IF NOT EXISTS "dueDateWindow" "CrmEnquiryDueDateWindow",
  ADD COLUMN IF NOT EXISTS "dueDate" TIMESTAMP(3),
  ADD COLUMN IF NOT EXISTS "nextFollowupDate" TIMESTAMP(3);

ALTER TABLE "CrmFollowUp"
  ADD COLUMN IF NOT EXISTS "nextFollowupDate" TIMESTAMP(3);

CREATE INDEX IF NOT EXISTS "CrmEnquiry_dueDate_idx" ON "CrmEnquiry"("dueDate");
CREATE INDEX IF NOT EXISTS "CrmEnquiry_nextFollowupDate_idx" ON "CrmEnquiry"("nextFollowupDate");
CREATE INDEX IF NOT EXISTS "CrmEnquiry_createdAt_idx" ON "CrmEnquiry"("createdAt");
CREATE INDEX IF NOT EXISTS "CrmFollowUp_nextFollowupDate_idx" ON "CrmFollowUp"("nextFollowupDate");
