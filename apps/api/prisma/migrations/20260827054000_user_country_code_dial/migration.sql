-- Store ISD dial codes (e.g. +91), not ISO letters. Backfill existing rows.
UPDATE "User" SET "countryCode" = '+91' WHERE "countryCode" NOT LIKE '+%';
ALTER TABLE "User" ALTER COLUMN "countryCode" SET DEFAULT '+91';
