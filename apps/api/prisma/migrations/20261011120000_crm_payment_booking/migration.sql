-- Link a client payment to the calendar booking it belongs to, so totals
-- stay with that booking when the same client books again.

ALTER TABLE "CrmPayment" ADD COLUMN "bookingId" TEXT;

CREATE INDEX "CrmPayment_bookingId_idx" ON "CrmPayment"("bookingId");

ALTER TABLE "CrmPayment" ADD CONSTRAINT "CrmPayment_bookingId_fkey" FOREIGN KEY ("bookingId") REFERENCES "CrmCalendarEvent"("id") ON DELETE SET NULL ON UPDATE CASCADE;
