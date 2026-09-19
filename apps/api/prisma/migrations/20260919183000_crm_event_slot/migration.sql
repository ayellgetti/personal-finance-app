-- CreateEnum
CREATE TYPE "CrmEventSlot" AS ENUM ('morning', 'evening', 'full_day');

-- AlterTable
ALTER TABLE "CrmCalendarEvent" ADD COLUMN "slot" "CrmEventSlot";
