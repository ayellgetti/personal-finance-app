-- PaymentType and PaymentMode only. Existing method strings map onto PaymentMode.

CREATE TYPE "PaymentType" AS ENUM ('INCOME', 'EXPENSE');
CREATE TYPE "PaymentMode" AS ENUM ('CASH', 'UPI', 'CARD', 'BANK_TRANSFER', 'CHEQUE');

ALTER TABLE "CrmPayment" ADD COLUMN "type" "PaymentType" NOT NULL DEFAULT 'INCOME';
ALTER TABLE "CrmPayment" ADD COLUMN "mode" "PaymentMode";

UPDATE "CrmPayment"
SET "mode" = CASE lower(trim("method"))
  WHEN 'cash' THEN 'CASH'::"PaymentMode"
  WHEN 'upi' THEN 'UPI'::"PaymentMode"
  WHEN 'card' THEN 'CARD'::"PaymentMode"
  WHEN 'cheque' THEN 'CHEQUE'::"PaymentMode"
  WHEN 'bank transfer' THEN 'BANK_TRANSFER'::"PaymentMode"
  WHEN 'bank_transfer' THEN 'BANK_TRANSFER'::"PaymentMode"
  ELSE 'CASH'::"PaymentMode"
END;

ALTER TABLE "CrmPayment" ALTER COLUMN "mode" SET NOT NULL;
ALTER TABLE "CrmPayment" DROP COLUMN "method";
