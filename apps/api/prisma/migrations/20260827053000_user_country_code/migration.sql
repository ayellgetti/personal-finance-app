-- Persist the signup country (ISO 3166-1 alpha-2). Existing users default to IN.
ALTER TABLE "User" ADD COLUMN "countryCode" TEXT NOT NULL DEFAULT 'IN';
