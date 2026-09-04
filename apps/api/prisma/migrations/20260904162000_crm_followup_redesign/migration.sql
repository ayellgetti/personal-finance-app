-- Follow-up redesign: activity log per enquiry.
-- Idempotent: uses IF NOT EXISTS / IF EXISTS guards throughout.
-- status (CrmFollowUpStatus) → stage (CrmEnquiryStatus), enquiryId required.
-- Also adds closedReason to CrmEnquiry.

-- 1. Drop old status column if it still exists
ALTER TABLE "CrmFollowUp" DROP COLUMN IF EXISTS "status";

-- 2. Drop the now-unused enum if it still exists
DROP TYPE IF EXISTS "CrmFollowUpStatus";

-- 3. Add stage column (mirrors enquiry stage at time of log entry)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'CrmFollowUp' AND column_name = 'stage'
  ) THEN
    ALTER TABLE "CrmFollowUp" ADD COLUMN "stage" "CrmEnquiryStatus" NOT NULL DEFAULT 'new';
  END IF;
END $$;

-- 4. Add enquiryId (required FK, CASCADE delete)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'CrmFollowUp' AND column_name = 'enquiryId'
  ) THEN
    ALTER TABLE "CrmFollowUp" ADD COLUMN "enquiryId" TEXT NOT NULL;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'CrmFollowUp_enquiryId_fkey'
  ) THEN
    ALTER TABLE "CrmFollowUp"
      ADD CONSTRAINT "CrmFollowUp_enquiryId_fkey"
      FOREIGN KEY ("enquiryId") REFERENCES "CrmEnquiry"("id") ON DELETE CASCADE;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS "CrmFollowUp_enquiryId_idx" ON "CrmFollowUp"("enquiryId");

-- 5. Drop assignedToId column if it still exists
ALTER TABLE "CrmFollowUp" DROP CONSTRAINT IF EXISTS "CrmFollowUp_assignedToId_fkey";
DROP INDEX IF EXISTS "CrmFollowUp_assignedToId_idx";
ALTER TABLE "CrmFollowUp" DROP COLUMN IF EXISTS "assignedToId";

-- 6. Add closedReason to CrmEnquiry
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'CrmEnquiry' AND column_name = 'closedReason'
  ) THEN
    ALTER TABLE "CrmEnquiry" ADD COLUMN "closedReason" TEXT;
  END IF;
END $$;
