-- Stored invoices so a saved document can be reprinted later.

CREATE TYPE "CrmInvoiceStatus" AS ENUM ('draft', 'issued', 'paid', 'cancelled');

CREATE TABLE "CrmInvoice" (
    "id" TEXT NOT NULL,
    "number" TEXT NOT NULL,
    "contactId" TEXT NOT NULL,
    "status" "CrmInvoiceStatus" NOT NULL DEFAULT 'draft',
    "issuedAt" TIMESTAMP(3) NOT NULL,
    "dueAt" TIMESTAMP(3),
    "currency" TEXT NOT NULL DEFAULT 'INR',
    "notes" TEXT,
    "billToName" TEXT NOT NULL,
    "billToMobile" TEXT NOT NULL,
    "taxPercent" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "subtotal" DOUBLE PRECISION NOT NULL,
    "taxAmount" DOUBLE PRECISION NOT NULL,
    "total" DOUBLE PRECISION NOT NULL,
    "isActive" INTEGER NOT NULL DEFAULT 1,
    "createdBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedBy" TEXT,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedBy" TEXT,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "CrmInvoice_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "CrmInvoiceLine" (
    "id" TEXT NOT NULL,
    "invoiceId" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "quantity" DOUBLE PRECISION NOT NULL,
    "unitPrice" DOUBLE PRECISION NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "sortOrder" INTEGER NOT NULL,
    "isActive" INTEGER NOT NULL DEFAULT 1,
    "createdBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedBy" TEXT,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedBy" TEXT,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "CrmInvoiceLine_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "CrmInvoice_number_key" ON "CrmInvoice"("number");
CREATE INDEX "CrmInvoice_contactId_idx" ON "CrmInvoice"("contactId");
CREATE INDEX "CrmInvoice_status_idx" ON "CrmInvoice"("status");
CREATE INDEX "CrmInvoice_issuedAt_idx" ON "CrmInvoice"("issuedAt");
CREATE INDEX "CrmInvoiceLine_invoiceId_idx" ON "CrmInvoiceLine"("invoiceId");

ALTER TABLE "CrmInvoice" ADD CONSTRAINT "CrmInvoice_contactId_fkey" FOREIGN KEY ("contactId") REFERENCES "CrmContact"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "CrmInvoiceLine" ADD CONSTRAINT "CrmInvoiceLine_invoiceId_fkey" FOREIGN KEY ("invoiceId") REFERENCES "CrmInvoice"("id") ON DELETE CASCADE ON UPDATE CASCADE;
