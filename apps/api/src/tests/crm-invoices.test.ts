import assert from "node:assert/strict";
import test from "node:test";
import type { CrmInvoice, CrmInvoiceLine } from "@prisma/client";
import { HttpError } from "../utils/http-error.util";
import { InvoiceService } from "../modules/sales-crm/invoices/invoice.service";
import { computeInvoice } from "../modules/sales-crm/invoices/invoice.math";
import type {
  CrmContactModel,
  CrmInvoiceLineModel,
  CrmInvoiceModel,
  InvoiceLineWrite,
  InvoiceWithLines,
} from "../models/index";
import { fakeCrud } from "./crm-test-utils";

type FakeContact = {
  id: string;
  name: string;
  mobile: string;
  isActive: number;
};

function invoiceService() {
  const contacts = fakeCrud("contact", [
    { id: "contact-1", name: "Ada", mobile: "9876543210", isActive: 1 },
  ] as FakeContact[]);
  const invoices = fakeCrud<CrmInvoice>("invoice");
  const lines = fakeCrud<CrmInvoiceLine>("line");

  const store = {
    ...invoices.model,
    async highestSequence(prefix: string) {
      return invoices.rows.reduce((max, row) => {
        if (!row.number.startsWith(prefix)) return max;
        const sequence = Number(row.number.slice(prefix.length));
        return Number.isInteger(sequence) && sequence > max ? sequence : max;
      }, 0);
    },
    async insertDocument(
      header: Omit<CrmInvoice, "id" | "isActive"> & { isActive?: number },
      lineInputs: InvoiceLineWrite[],
    ): Promise<InvoiceWithLines> {
      const invoice = await invoices.model.create(header);
      const stored: CrmInvoiceLine[] = [];
      for (const line of lineInputs) {
        stored.push(await lines.model.create({ ...line, invoiceId: invoice.id } as CrmInvoiceLine));
      }
      return { ...invoice, lines: stored };
    },
    async replaceDocument(
      id: string,
      header: Partial<CrmInvoice>,
      lineInputs: InvoiceLineWrite[],
      retired: Partial<CrmInvoiceLine>,
    ): Promise<InvoiceWithLines> {
      const invoice = await invoices.model.update({ id }, header);
      await lines.model.updateMany({ invoiceId: id, isActive: 1 }, retired);
      const stored: CrmInvoiceLine[] = [];
      for (const line of lineInputs) {
        stored.push(await lines.model.create({ ...line, invoiceId: id } as CrmInvoiceLine));
      }
      return { ...invoice, lines: stored };
    },
    async deactivate(id: string, data: Partial<CrmInvoice>) {
      await lines.model.updateMany({ invoiceId: id, isActive: 1 }, data);
      return invoices.model.update({ id }, data);
    },
  };

  return {
    service: new InvoiceService(
      store as unknown as CrmInvoiceModel,
      lines.model as unknown as CrmInvoiceLineModel,
      contacts.model as unknown as CrmContactModel,
    ),
    invoices: invoices.rows,
    lines: lines.rows,
  };
}

test("invoice totals round line amounts and tax", () => {
  const totals = computeInvoice(
    [
      { description: "Hall", quantity: 2, unitPrice: 100.125 },
      { description: "Decor", quantity: 1, unitPrice: 50 },
    ],
    18,
  );
  assert.equal(totals.lines[0]?.amount, 200.25);
  assert.equal(totals.subtotal, 250.25);
  assert.equal(totals.taxAmount, 45.05);
  assert.equal(totals.total, 295.3);
});

test("invoice create stores a printable document and numbers the next one", async () => {
  const { service, invoices } = invoiceService();
  const created = await service.create("user-1", {
    contactId: "contact-1",
    lines: [{ description: "Banquet hall", quantity: 1, unitPrice: 1000 }],
    taxPercent: 18,
  });
  assert.match(created.number, /^INV-\d{4}-0001$/);
  assert.equal(created.billToName, "Ada");
  assert.equal(created.billToMobile, "9876543210");
  assert.equal(created.subtotal, 1000);
  assert.equal(created.taxAmount, 180);
  assert.equal(created.total, 1180);
  assert.equal(created.lines.length, 1);
  assert.equal(created.createdBy, "user-1");

  const second = await service.create("user-1", {
    contactId: "contact-1",
    status: "issued",
    lines: [{ description: "Catering", quantity: 2, unitPrice: 250 }],
  });
  assert.match(second.number, /^INV-\d{4}-0002$/);
  assert.equal(second.status, "issued");
  assert.equal(invoices.length, 2);

  const listed = await service.list({ search: "Ada" });
  assert.equal(listed.items.length, 2);
  const byNumber = await service.list({ search: second.number });
  assert.equal(byNumber.items.length, 1);
});

test("invoice update replaces lines and remove hides the document", async () => {
  const { service, lines } = invoiceService();
  const created = await service.create("user-1", {
    contactId: "contact-1",
    lines: [{ description: "Hall", quantity: 1, unitPrice: 500 }],
  });
  const updated = await service.update("user-2", created.id, {
    status: "paid",
    lines: [{ description: "Hall revised", quantity: 2, unitPrice: 400 }],
  });
  assert.equal(updated.status, "paid");
  assert.equal(updated.total, 800);
  assert.equal(updated.lines.length, 1);
  assert.equal(updated.lines[0]?.description, "Hall revised");
  assert.equal(updated.updatedBy, "user-2");
  assert.equal(lines.filter((line) => line.isActive === 1).length, 1);

  const loaded = await service.getById(created.id);
  assert.equal(loaded.lines[0]?.amount, 800);

  await service.remove("user-2", { id: created.id });
  const after = await service.list({});
  assert.equal(after.items.length, 0);
  await assert.rejects(
    () => service.getById(created.id),
    (error: unknown) => error instanceof HttpError && error.status === 404,
  );
});

test("invoice create rejects an unknown contact", async () => {
  const { service } = invoiceService();
  await assert.rejects(
    () =>
      service.create("user-1", {
        contactId: "missing",
        lines: [{ description: "Hall", quantity: 1, unitPrice: 10 }],
      }),
    (error: unknown) => error instanceof HttpError && error.status === 404,
  );
});
