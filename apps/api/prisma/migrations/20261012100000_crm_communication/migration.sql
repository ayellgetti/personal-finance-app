-- Templates and scheduled outbound email, SMS, and in-app notifications.

CREATE TYPE "CrmChannel" AS ENUM ('email', 'sms', 'in_app');

CREATE TYPE "CrmMessageStatus" AS ENUM ('scheduled', 'sending', 'sent', 'failed', 'cancelled');

CREATE TABLE "CrmMessageTemplate" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "channel" "CrmChannel" NOT NULL,
    "subject" TEXT,
    "body" TEXT NOT NULL,
    "isActive" INTEGER NOT NULL DEFAULT 1,
    "createdBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedBy" TEXT,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedBy" TEXT,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "CrmMessageTemplate_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "CrmMessage" (
    "id" TEXT NOT NULL,
    "channel" "CrmChannel" NOT NULL,
    "templateId" TEXT,
    "subject" TEXT,
    "body" TEXT NOT NULL,
    "contactId" TEXT,
    "recipientUserId" TEXT,
    "toAddress" TEXT,
    "variables" JSONB NOT NULL DEFAULT '{}',
    "scheduledAt" TIMESTAMP(3) NOT NULL,
    "status" "CrmMessageStatus" NOT NULL DEFAULT 'scheduled',
    "sentAt" TIMESTAMP(3),
    "errorMessage" TEXT,
    "read" INTEGER NOT NULL DEFAULT 0,
    "readAt" TIMESTAMP(3),
    "isActive" INTEGER NOT NULL DEFAULT 1,
    "createdBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedBy" TEXT,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedBy" TEXT,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "CrmMessage_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "CrmMessageTemplate_channel_idx" ON "CrmMessageTemplate"("channel");
CREATE INDEX "CrmMessageTemplate_name_idx" ON "CrmMessageTemplate"("name");
CREATE INDEX "CrmMessage_status_scheduledAt_idx" ON "CrmMessage"("status", "scheduledAt");
CREATE INDEX "CrmMessage_channel_idx" ON "CrmMessage"("channel");
CREATE INDEX "CrmMessage_contactId_idx" ON "CrmMessage"("contactId");
CREATE INDEX "CrmMessage_recipientUserId_status_idx" ON "CrmMessage"("recipientUserId", "status");
CREATE INDEX "CrmMessage_templateId_idx" ON "CrmMessage"("templateId");

ALTER TABLE "CrmMessage" ADD CONSTRAINT "CrmMessage_templateId_fkey" FOREIGN KEY ("templateId") REFERENCES "CrmMessageTemplate"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "CrmMessage" ADD CONSTRAINT "CrmMessage_contactId_fkey" FOREIGN KEY ("contactId") REFERENCES "CrmContact"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "CrmMessage" ADD CONSTRAINT "CrmMessage_recipientUserId_fkey" FOREIGN KEY ("recipientUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
