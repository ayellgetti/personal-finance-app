-- CreateEnum
CREATE TYPE "CrmContactType" AS ENUM ('lead', 'client', 'vendor', 'employee');

-- CreateEnum
CREATE TYPE "CrmEnquiryStatus" AS ENUM ('new', 'in_progress', 'won', 'lost', 'on_hold');

-- CreateEnum
CREATE TYPE "CrmFollowUpStatus" AS ENUM ('pending', 'completed', 'cancelled');

-- CreateEnum
CREATE TYPE "CrmClientStatus" AS ENUM ('active', 'inactive');

-- CreateEnum
CREATE TYPE "CrmPaymentStatus" AS ENUM ('pending', 'paid', 'failed', 'refunded');

-- CreateEnum
CREATE TYPE "CrmTaskStatus" AS ENUM ('todo', 'in_progress', 'in_review', 'done');

-- CreateTable
CREATE TABLE "Role" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "isActive" INTEGER NOT NULL DEFAULT 1,
    "createdBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedBy" TEXT,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedBy" TEXT,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "Role_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Permission" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "isActive" INTEGER NOT NULL DEFAULT 1,
    "createdBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedBy" TEXT,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedBy" TEXT,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "Permission_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RolePermission" (
    "id" TEXT NOT NULL,
    "roleId" TEXT NOT NULL,
    "permissionId" TEXT NOT NULL,
    "isActive" INTEGER NOT NULL DEFAULT 1,
    "createdBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedBy" TEXT,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedBy" TEXT,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "RolePermission_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserRole" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "roleId" TEXT NOT NULL,
    "isActive" INTEGER NOT NULL DEFAULT 1,
    "createdBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedBy" TEXT,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedBy" TEXT,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "UserRole_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CrmContact" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "mobile" TEXT NOT NULL,
    "type" "CrmContactType" NOT NULL,
    "email" TEXT,
    "companyName" TEXT,
    "notes" TEXT,
    "isActive" INTEGER NOT NULL DEFAULT 1,
    "createdBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedBy" TEXT,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedBy" TEXT,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "CrmContact_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CrmEnquiry" (
    "id" TEXT NOT NULL,
    "contactId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "source" TEXT NOT NULL,
    "status" "CrmEnquiryStatus" NOT NULL DEFAULT 'new',
    "expectedValue" DOUBLE PRECISION,
    "assignedToId" TEXT,
    "notes" TEXT,
    "isActive" INTEGER NOT NULL DEFAULT 1,
    "createdBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedBy" TEXT,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedBy" TEXT,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "CrmEnquiry_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CrmFollowUp" (
    "id" TEXT NOT NULL,
    "enquiryId" TEXT,
    "contactId" TEXT NOT NULL,
    "dueAt" TIMESTAMP(3) NOT NULL,
    "status" "CrmFollowUpStatus" NOT NULL DEFAULT 'pending',
    "assignedToId" TEXT,
    "notes" TEXT,
    "isActive" INTEGER NOT NULL DEFAULT 1,
    "createdBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedBy" TEXT,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedBy" TEXT,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "CrmFollowUp_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CrmClient" (
    "id" TEXT NOT NULL,
    "contactId" TEXT NOT NULL,
    "status" "CrmClientStatus" NOT NULL DEFAULT 'active',
    "billingName" TEXT NOT NULL,
    "gstin" TEXT,
    "convertedFromEnquiryId" TEXT,
    "isActive" INTEGER NOT NULL DEFAULT 1,
    "createdBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedBy" TEXT,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedBy" TEXT,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "CrmClient_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CrmPayment" (
    "id" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "enquiryId" TEXT,
    "amount" DOUBLE PRECISION NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'INR',
    "method" TEXT NOT NULL,
    "status" "CrmPaymentStatus" NOT NULL DEFAULT 'pending',
    "paidAt" TIMESTAMP(3),
    "reference" TEXT,
    "isActive" INTEGER NOT NULL DEFAULT 1,
    "createdBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedBy" TEXT,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedBy" TEXT,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "CrmPayment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CrmTask" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "status" "CrmTaskStatus" NOT NULL DEFAULT 'todo',
    "assigneeId" TEXT,
    "dueAt" TIMESTAMP(3),
    "contactId" TEXT,
    "enquiryId" TEXT,
    "isActive" INTEGER NOT NULL DEFAULT 1,
    "createdBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedBy" TEXT,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedBy" TEXT,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "CrmTask_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CrmCalendarEvent" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "startsAt" TIMESTAMP(3) NOT NULL,
    "endsAt" TIMESTAMP(3) NOT NULL,
    "contactId" TEXT,
    "enquiryId" TEXT,
    "assigneeId" TEXT,
    "notes" TEXT,
    "isActive" INTEGER NOT NULL DEFAULT 1,
    "createdBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedBy" TEXT,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedBy" TEXT,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "CrmCalendarEvent_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Role_name_key" ON "Role"("name");

-- CreateIndex
CREATE UNIQUE INDEX "Role_slug_key" ON "Role"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "Permission_code_key" ON "Permission"("code");

-- CreateIndex
CREATE INDEX "RolePermission_permissionId_idx" ON "RolePermission"("permissionId");

-- CreateIndex
CREATE UNIQUE INDEX "RolePermission_roleId_permissionId_key" ON "RolePermission"("roleId", "permissionId");

-- CreateIndex
CREATE INDEX "UserRole_roleId_idx" ON "UserRole"("roleId");

-- CreateIndex
CREATE UNIQUE INDEX "UserRole_userId_roleId_key" ON "UserRole"("userId", "roleId");

-- CreateIndex
CREATE INDEX "CrmContact_mobile_idx" ON "CrmContact"("mobile");

-- CreateIndex
CREATE UNIQUE INDEX "CrmContact_mobile_active_key" ON "CrmContact"("mobile") WHERE "isActive" = 1;

-- CreateIndex
CREATE INDEX "CrmContact_type_idx" ON "CrmContact"("type");

-- CreateIndex
CREATE INDEX "CrmEnquiry_status_idx" ON "CrmEnquiry"("status");

-- CreateIndex
CREATE INDEX "CrmEnquiry_contactId_idx" ON "CrmEnquiry"("contactId");

-- CreateIndex
CREATE INDEX "CrmEnquiry_assignedToId_idx" ON "CrmEnquiry"("assignedToId");

-- CreateIndex
CREATE INDEX "CrmFollowUp_dueAt_idx" ON "CrmFollowUp"("dueAt");

-- CreateIndex
CREATE INDEX "CrmFollowUp_status_idx" ON "CrmFollowUp"("status");

-- CreateIndex
CREATE INDEX "CrmFollowUp_assignedToId_idx" ON "CrmFollowUp"("assignedToId");

-- CreateIndex
CREATE INDEX "CrmFollowUp_contactId_idx" ON "CrmFollowUp"("contactId");

-- CreateIndex
CREATE INDEX "CrmFollowUp_enquiryId_idx" ON "CrmFollowUp"("enquiryId");

-- CreateIndex
CREATE UNIQUE INDEX "CrmClient_contactId_key" ON "CrmClient"("contactId");

-- CreateIndex
CREATE UNIQUE INDEX "CrmClient_convertedFromEnquiryId_key" ON "CrmClient"("convertedFromEnquiryId");

-- CreateIndex
CREATE INDEX "CrmPayment_clientId_idx" ON "CrmPayment"("clientId");

-- CreateIndex
CREATE INDEX "CrmPayment_status_idx" ON "CrmPayment"("status");

-- CreateIndex
CREATE INDEX "CrmPayment_paidAt_idx" ON "CrmPayment"("paidAt");

-- CreateIndex
CREATE INDEX "CrmPayment_enquiryId_idx" ON "CrmPayment"("enquiryId");

-- CreateIndex
CREATE INDEX "CrmTask_status_idx" ON "CrmTask"("status");

-- CreateIndex
CREATE INDEX "CrmTask_assigneeId_idx" ON "CrmTask"("assigneeId");

-- CreateIndex
CREATE INDEX "CrmTask_dueAt_idx" ON "CrmTask"("dueAt");

-- CreateIndex
CREATE INDEX "CrmTask_contactId_idx" ON "CrmTask"("contactId");

-- CreateIndex
CREATE INDEX "CrmTask_enquiryId_idx" ON "CrmTask"("enquiryId");

-- CreateIndex
CREATE INDEX "CrmCalendarEvent_startsAt_idx" ON "CrmCalendarEvent"("startsAt");

-- CreateIndex
CREATE INDEX "CrmCalendarEvent_assigneeId_idx" ON "CrmCalendarEvent"("assigneeId");

-- CreateIndex
CREATE INDEX "CrmCalendarEvent_contactId_idx" ON "CrmCalendarEvent"("contactId");

-- CreateIndex
CREATE INDEX "CrmCalendarEvent_enquiryId_idx" ON "CrmCalendarEvent"("enquiryId");

-- AddForeignKey
ALTER TABLE "RolePermission" ADD CONSTRAINT "RolePermission_roleId_fkey" FOREIGN KEY ("roleId") REFERENCES "Role"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RolePermission" ADD CONSTRAINT "RolePermission_permissionId_fkey" FOREIGN KEY ("permissionId") REFERENCES "Permission"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserRole" ADD CONSTRAINT "UserRole_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserRole" ADD CONSTRAINT "UserRole_roleId_fkey" FOREIGN KEY ("roleId") REFERENCES "Role"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CrmEnquiry" ADD CONSTRAINT "CrmEnquiry_contactId_fkey" FOREIGN KEY ("contactId") REFERENCES "CrmContact"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CrmEnquiry" ADD CONSTRAINT "CrmEnquiry_assignedToId_fkey" FOREIGN KEY ("assignedToId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CrmFollowUp" ADD CONSTRAINT "CrmFollowUp_enquiryId_fkey" FOREIGN KEY ("enquiryId") REFERENCES "CrmEnquiry"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CrmFollowUp" ADD CONSTRAINT "CrmFollowUp_contactId_fkey" FOREIGN KEY ("contactId") REFERENCES "CrmContact"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CrmFollowUp" ADD CONSTRAINT "CrmFollowUp_assignedToId_fkey" FOREIGN KEY ("assignedToId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CrmClient" ADD CONSTRAINT "CrmClient_contactId_fkey" FOREIGN KEY ("contactId") REFERENCES "CrmContact"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CrmClient" ADD CONSTRAINT "CrmClient_convertedFromEnquiryId_fkey" FOREIGN KEY ("convertedFromEnquiryId") REFERENCES "CrmEnquiry"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CrmPayment" ADD CONSTRAINT "CrmPayment_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "CrmClient"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CrmPayment" ADD CONSTRAINT "CrmPayment_enquiryId_fkey" FOREIGN KEY ("enquiryId") REFERENCES "CrmEnquiry"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CrmTask" ADD CONSTRAINT "CrmTask_assigneeId_fkey" FOREIGN KEY ("assigneeId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CrmTask" ADD CONSTRAINT "CrmTask_contactId_fkey" FOREIGN KEY ("contactId") REFERENCES "CrmContact"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CrmTask" ADD CONSTRAINT "CrmTask_enquiryId_fkey" FOREIGN KEY ("enquiryId") REFERENCES "CrmEnquiry"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CrmCalendarEvent" ADD CONSTRAINT "CrmCalendarEvent_contactId_fkey" FOREIGN KEY ("contactId") REFERENCES "CrmContact"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CrmCalendarEvent" ADD CONSTRAINT "CrmCalendarEvent_enquiryId_fkey" FOREIGN KEY ("enquiryId") REFERENCES "CrmEnquiry"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CrmCalendarEvent" ADD CONSTRAINT "CrmCalendarEvent_assigneeId_fkey" FOREIGN KEY ("assigneeId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
