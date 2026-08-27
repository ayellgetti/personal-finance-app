-- Persist the signup ISD dial code. Existing users default to +91.
ALTER TABLE "User" ADD COLUMN "countryCode" TEXT NOT NULL DEFAULT '+91';
