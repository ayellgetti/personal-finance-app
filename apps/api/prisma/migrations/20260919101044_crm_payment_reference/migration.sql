-- CrmPayment payee is now a single polymorphic reference instead of two
-- separate nullable FKs: referenceType ("client" | "vendor") + referenceId.
-- No DB-level FK on referenceId (it can point at CrmClient or CrmContact);
-- PaymentService enforces the referenced row exists and is active.

-- CreateEnum
CREATE TYPE "CrmPaymentReferenceType" AS ENUM ('client', 'vendor');

-- AlterTable: add the new columns nullable first so we can backfill.
ALTER TABLE "CrmPayment"
  ADD COLUMN "referenceType" "CrmPaymentReferenceType",
  ADD COLUMN "referenceId" TEXT;

-- Backfill from the existing clientId / vendorContactId columns.
UPDATE "CrmPayment"
SET "referenceType" = 'client', "referenceId" = "clientId"
WHERE "clientId" IS NOT NULL;

UPDATE "CrmPayment"
SET "referenceType" = 'vendor', "referenceId" = "vendorContactId"
WHERE "vendorContactId" IS NOT NULL;

-- Every existing row had exactly one of clientId/vendorContactId set, so the
-- new columns are now fully populated and can be made required.
ALTER TABLE "CrmPayment"
  ALTER COLUMN "referenceType" SET NOT NULL,
  ALTER COLUMN "referenceId" SET NOT NULL;

-- DropForeignKey
ALTER TABLE "CrmPayment" DROP CONSTRAINT IF EXISTS "CrmPayment_clientId_fkey";
ALTER TABLE "CrmPayment" DROP CONSTRAINT IF EXISTS "CrmPayment_vendorContactId_fkey";

-- DropIndex
DROP INDEX IF EXISTS "CrmPayment_clientId_idx";
DROP INDEX IF EXISTS "CrmPayment_vendorContactId_idx";

-- AlterTable: drop the old columns now that data lives on referenceType/referenceId.
ALTER TABLE "CrmPayment"
  DROP COLUMN "clientId",
  DROP COLUMN "vendorContactId";

-- CreateIndex
CREATE INDEX "CrmPayment_referenceType_referenceId_idx" ON "CrmPayment"("referenceType", "referenceId");
