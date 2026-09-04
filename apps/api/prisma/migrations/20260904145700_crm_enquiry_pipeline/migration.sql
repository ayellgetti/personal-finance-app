-- Replace the five generic enquiry statuses with the eight-stage sales pipeline.
-- Existing rows: in_progress/on_hold → discussion; won/lost → closed.

ALTER TABLE "CrmEnquiry" ALTER COLUMN "status" DROP DEFAULT;

CREATE TYPE "CrmEnquiryStatus_new" AS ENUM (
  'new',
  'contacted',
  'qualified',
  'discussion',
  'quotation_sent',
  'negotiation',
  'schedule_meeting',
  'closed'
);

ALTER TABLE "CrmEnquiry"
  ALTER COLUMN "status" TYPE "CrmEnquiryStatus_new"
  USING (
    CASE "status"::text
      WHEN 'new' THEN 'new'
      WHEN 'in_progress' THEN 'discussion'
      WHEN 'on_hold' THEN 'discussion'
      WHEN 'won' THEN 'closed'
      WHEN 'lost' THEN 'closed'
      ELSE 'new'
    END
  )::"CrmEnquiryStatus_new";

DROP TYPE "CrmEnquiryStatus";

ALTER TYPE "CrmEnquiryStatus_new" RENAME TO "CrmEnquiryStatus";

ALTER TABLE "CrmEnquiry" ALTER COLUMN "status" SET DEFAULT 'new'::"CrmEnquiryStatus";
