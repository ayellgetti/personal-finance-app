-- Align every table with User audit columns:
-- isActive, createdBy, createdAt, updatedBy, updatedAt, deletedBy, deletedAt
-- and store createdBy / updatedBy / deletedBy as TEXT.

-- Missing audit columns
ALTER TABLE "FinancialProfile" ADD COLUMN "createdBy" TEXT,
ADD COLUMN "updatedBy" TEXT,
ADD COLUMN "deletedBy" TEXT,
ADD COLUMN "deletedAt" TIMESTAMP(3);

ALTER TABLE "RefreshSession" ADD COLUMN "isActive" INTEGER NOT NULL DEFAULT 1,
ADD COLUMN "createdBy" TEXT,
ADD COLUMN "updatedBy" TEXT,
ADD COLUMN "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN "deletedBy" TEXT,
ADD COLUMN "deletedAt" TIMESTAMP(3);

ALTER TABLE "FailureLog" ADD COLUMN "isActive" INTEGER NOT NULL DEFAULT 1,
ADD COLUMN "createdBy" TEXT,
ADD COLUMN "updatedBy" TEXT,
ADD COLUMN "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN "deletedBy" TEXT,
ADD COLUMN "deletedAt" TIMESTAMP(3);

ALTER TABLE "Session" ADD COLUMN "deletedBy" TEXT,
ADD COLUMN "deletedAt" TIMESTAMP(3);

ALTER TABLE "Otp" ADD COLUMN "deletedBy" TEXT,
ADD COLUMN "deletedAt" TIMESTAMP(3);

ALTER TABLE "Categories" ADD COLUMN "deletedBy" TEXT,
ADD COLUMN "deletedAt" TIMESTAMP(3);

ALTER TABLE "Transaction" ADD COLUMN "deletedBy" TEXT,
ADD COLUMN "deletedAt" TIMESTAMP(3);

ALTER TABLE "StatementLine" ADD COLUMN "deletedBy" TEXT,
ADD COLUMN "deletedAt" TIMESTAMP(3);

ALTER TABLE "Device" ADD COLUMN "deletedBy" TEXT,
ADD COLUMN "deletedAt" TIMESTAMP(3);

ALTER TABLE "Socket" ADD COLUMN "deletedBy" TEXT,
ADD COLUMN "deletedAt" TIMESTAMP(3);

ALTER TABLE "Notification" ADD COLUMN "isActive" INTEGER NOT NULL DEFAULT 1,
ADD COLUMN "deletedBy" TEXT,
ADD COLUMN "deletedAt" TIMESTAMP(3);

ALTER TABLE "Conversation" ADD COLUMN "deletedBy" TEXT,
ADD COLUMN "deletedAt" TIMESTAMP(3);

ALTER TABLE "ConversationMember" ADD COLUMN "deletedBy" TEXT,
ADD COLUMN "deletedAt" TIMESTAMP(3);

ALTER TABLE "ConversationMessage" ADD COLUMN "deletedBy" TEXT,
ADD COLUMN "deletedAt" TIMESTAMP(3);

ALTER TABLE "ConversationMessageStatus" ADD COLUMN "deletedBy" TEXT,
ADD COLUMN "deletedAt" TIMESTAMP(3);

ALTER TABLE "Tradingview" ADD COLUMN "deletedBy" TEXT,
ADD COLUMN "deletedAt" TIMESTAMP(3);

-- Integer actor ids → TEXT (user ids are UUIDs)
ALTER TABLE "Contact" ALTER COLUMN "createdBy" TYPE TEXT USING "createdBy"::TEXT,
ALTER COLUMN "updatedBy" TYPE TEXT USING "updatedBy"::TEXT,
ALTER COLUMN "deletedBy" TYPE TEXT USING "deletedBy"::TEXT;

ALTER TABLE "Constant" ALTER COLUMN "createdBy" TYPE TEXT USING "createdBy"::TEXT,
ALTER COLUMN "updatedBy" TYPE TEXT USING "updatedBy"::TEXT,
ALTER COLUMN "deletedBy" TYPE TEXT USING "deletedBy"::TEXT;

ALTER TABLE "Budget" ALTER COLUMN "createdBy" TYPE TEXT USING "createdBy"::TEXT,
ALTER COLUMN "updatedBy" TYPE TEXT USING "updatedBy"::TEXT,
ALTER COLUMN "deletedBy" TYPE TEXT USING "deletedBy"::TEXT;

ALTER TABLE "Loan" ALTER COLUMN "createdBy" TYPE TEXT USING "createdBy"::TEXT,
ALTER COLUMN "updatedBy" TYPE TEXT USING "updatedBy"::TEXT,
ALTER COLUMN "deletedBy" TYPE TEXT USING "deletedBy"::TEXT;

ALTER TABLE "Investment" ALTER COLUMN "createdBy" TYPE TEXT USING "createdBy"::TEXT,
ALTER COLUMN "updatedBy" TYPE TEXT USING "updatedBy"::TEXT,
ALTER COLUMN "deletedBy" TYPE TEXT USING "deletedBy"::TEXT;

ALTER TABLE "Insurance" ALTER COLUMN "createdBy" TYPE TEXT USING "createdBy"::TEXT,
ALTER COLUMN "updatedBy" TYPE TEXT USING "updatedBy"::TEXT,
ALTER COLUMN "deletedBy" TYPE TEXT USING "deletedBy"::TEXT;

ALTER TABLE "Goal" ALTER COLUMN "createdBy" TYPE TEXT USING "createdBy"::TEXT,
ALTER COLUMN "updatedBy" TYPE TEXT USING "updatedBy"::TEXT,
ALTER COLUMN "deletedBy" TYPE TEXT USING "deletedBy"::TEXT;

ALTER TABLE "Planner" ALTER COLUMN "createdBy" TYPE TEXT USING "createdBy"::TEXT,
ALTER COLUMN "updatedBy" TYPE TEXT USING "updatedBy"::TEXT,
ALTER COLUMN "deletedBy" TYPE TEXT USING "deletedBy"::TEXT;
