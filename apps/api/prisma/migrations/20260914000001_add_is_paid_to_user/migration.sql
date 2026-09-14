-- AlterTable: add isPaid flag for paid tier gating
ALTER TABLE "User" ADD COLUMN "isPaid" BOOLEAN NOT NULL DEFAULT false;
