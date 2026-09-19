-- DropForeignKey
ALTER TABLE "CrmFollowUp" DROP CONSTRAINT "CrmFollowUp_enquiryId_fkey";

-- AlterTable
ALTER TABLE "CrmFollowUp" ALTER COLUMN "stage" DROP DEFAULT;

-- AlterTable
ALTER TABLE "CrmPayment" ADD COLUMN     "vendorContactId" TEXT,
ALTER COLUMN "clientId" DROP NOT NULL;

-- AlterTable
ALTER TABLE "FailureLog" ALTER COLUMN "updatedAt" DROP DEFAULT;

-- AlterTable
ALTER TABLE "Loan" ALTER COLUMN "type" DROP DEFAULT;

-- AlterTable
ALTER TABLE "RefreshSession" ALTER COLUMN "updatedAt" DROP DEFAULT;

-- CreateIndex
CREATE INDEX "CrmPayment_vendorContactId_idx" ON "CrmPayment"("vendorContactId");

-- AddForeignKey
ALTER TABLE "CrmFollowUp" ADD CONSTRAINT "CrmFollowUp_enquiryId_fkey" FOREIGN KEY ("enquiryId") REFERENCES "CrmEnquiry"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CrmPayment" ADD CONSTRAINT "CrmPayment_vendorContactId_fkey" FOREIGN KEY ("vendorContactId") REFERENCES "CrmContact"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
