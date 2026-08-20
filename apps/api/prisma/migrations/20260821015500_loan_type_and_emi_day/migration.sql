-- AlterTable
ALTER TABLE "Loan" ADD COLUMN "type" TEXT NOT NULL DEFAULT 'Personal Loan';

UPDATE "Loan"
SET type = CASE
  WHEN roi < 8 AND "remainingMonths" >= 100 THEN 'Home Loan'
  ELSE 'Personal Loan'
END;
