-- Follow-ups are now independent: remove the optional enquiry link.
ALTER TABLE "CrmFollowUp" DROP CONSTRAINT IF EXISTS "CrmFollowUp_enquiryId_fkey";
ALTER TABLE "CrmFollowUp" DROP COLUMN IF EXISTS "enquiryId";
