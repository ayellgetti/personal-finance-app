-- Invoice letterhead. Blank fields fall back to CRM_COMPANY_* environment settings.

CREATE TABLE "CrmCompanyProfile" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL DEFAULT '',
    "details" TEXT NOT NULL DEFAULT '',
    "contactName" TEXT NOT NULL DEFAULT '',
    "contactMobile" TEXT NOT NULL DEFAULT '',
    "logoDataUrl" TEXT,
    "isActive" INTEGER NOT NULL DEFAULT 1,
    "createdBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedBy" TEXT,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedBy" TEXT,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "CrmCompanyProfile_pkey" PRIMARY KEY ("id")
);
