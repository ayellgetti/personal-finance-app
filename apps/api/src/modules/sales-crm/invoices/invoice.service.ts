import { Prisma, type CrmContact, type CrmInvoiceLine } from "@prisma/client";
import { HttpError } from "../../../utils/http-error.util";
import {
  crmContactModel,
  crmInvoiceLineModel,
  crmInvoiceModel,
  type CrmContactModel,
  type CrmInvoiceLineModel,
  type CrmInvoiceModel,
  type InvoiceLineWrite,
  type InvoiceWithLines,
} from "../../../models/index";
import { actorCreate, actorDelete, actorUpdate, requireActive } from "../crm.util";
import {
  computeInvoice,
  formatInvoiceNumber,
  invoiceYearPrefix,
  type InvoiceLineInput,
} from "./invoice.math";
import type {
  CreateInvoiceBody,
  ListInvoicesQuery,
  RemoveInvoiceBody,
  UpdateInvoiceBody,
} from "./invoice.request";

type LineSource = Pick<CrmInvoiceLine, "description" | "quantity" | "unitPrice">;

export class InvoiceService {
  constructor(
    private readonly invoices: CrmInvoiceModel = crmInvoiceModel,
    private readonly lines: CrmInvoiceLineModel = crmInvoiceLineModel,
    private readonly contacts: CrmContactModel = crmContactModel,
  ) {}

  list(query: ListInvoicesQuery) {
    const where: Prisma.CrmInvoiceWhereInput = { isActive: 1 };
    if (query.status) where.status = query.status;
    if (query.contactId) where.contactId = query.contactId;
    if (query.search) {
      where.OR = [
        { number: { contains: query.search, mode: "insensitive" } },
        { billToName: { contains: query.search, mode: "insensitive" } },
        { billToMobile: { contains: query.search, mode: "insensitive" } },
      ];
    }
    return this.invoices.paginate(where, query.page ?? 1, query.limit ?? 25, {
      orderBy: [{ issuedAt: "desc" }, { createdAt: "desc" }],
    });
  }

  async getById(id: string): Promise<InvoiceWithLines> {
    const invoice = requireActive(await this.invoices.readOne({ id }), "Invoice");
    const stored = await this.lines.read(
      { invoiceId: id, isActive: 1 },
      { orderBy: { sortOrder: "asc" } },
    );
    const lines = [...stored].sort((left, right) => left.sortOrder - right.sortOrder);
    return { ...invoice, lines };
  }

  async create(actorId: string, input: CreateInvoiceBody): Promise<InvoiceWithLines> {
    const contact = await this.requireContact(input.contactId);
    const issuedAt = input.issuedAt ?? new Date();
    const totals = computeInvoice(input.lines, input.taxPercent ?? 0);
    const number = await this.nextNumber(issuedAt);
    const actors = actorCreate(actorId);
    return this.invoices.insertDocument(
      {
        number,
        contactId: contact.id,
        status: input.status ?? "draft",
        issuedAt,
        dueAt: input.dueAt ?? null,
        currency: (input.currency ?? "INR").toUpperCase(),
        notes: input.notes ?? null,
        billToName: contact.name,
        billToMobile: contact.mobile,
        taxPercent: totals.taxPercent,
        subtotal: totals.subtotal,
        taxAmount: totals.taxAmount,
        total: totals.total,
        ...actors,
      },
      this.lineWrites(totals.lines, actors),
    );
  }

  async update(actorId: string, id: string, input: UpdateInvoiceBody): Promise<InvoiceWithLines> {
    const existing = await this.getById(id);
    const contact = input.contactId ? await this.requireContact(input.contactId) : null;
    const taxPercent = input.taxPercent ?? existing.taxPercent;
    const source: InvoiceLineInput[] = input.lines ?? existing.lines.map(lineInput);
    const totals = computeInvoice(source, taxPercent);
    const actors = actorUpdate(actorId);
    const header: Prisma.CrmInvoiceUncheckedUpdateInput = {
      ...actors,
      taxPercent: totals.taxPercent,
      subtotal: totals.subtotal,
      taxAmount: totals.taxAmount,
      total: totals.total,
    };
    if (input.status) header.status = input.status;
    if (input.issuedAt) header.issuedAt = input.issuedAt;
    if (input.dueAt !== undefined) header.dueAt = input.dueAt;
    if (input.currency) header.currency = input.currency.toUpperCase();
    if (input.notes !== undefined) header.notes = input.notes;
    if (contact) {
      header.contactId = contact.id;
      header.billToName = contact.name;
      header.billToMobile = contact.mobile;
    }
    const replaceLines = Boolean(input.lines) || input.taxPercent !== undefined;
    if (!replaceLines) {
      const updated = await this.invoices.update({ id }, header);
      return { ...updated, lines: existing.lines };
    }
    return this.invoices.replaceDocument(id, header, this.lineWrites(totals.lines, {
      createdBy: actorId,
      updatedBy: actorId,
    }), {
      ...actorDelete(actorId),
    });
  }

  async remove(actorId: string, input: RemoveInvoiceBody) {
    await this.getById(input.id);
    await this.invoices.deactivate(input.id, actorDelete(actorId));
    return { id: input.id, removed: true };
  }

  private async nextNumber(issuedAt: Date): Promise<string> {
    const prefix = invoiceYearPrefix(issuedAt);
    const highest = await this.invoices.highestSequence(prefix);
    return formatInvoiceNumber(issuedAt.getFullYear(), highest + 1);
  }

  private lineWrites(
    lines: InvoiceTotalsLines,
    actors: { createdBy?: string; updatedBy?: string },
  ): InvoiceLineWrite[] {
    return lines.map((line) => ({
      description: line.description,
      quantity: line.quantity,
      unitPrice: line.unitPrice,
      amount: line.amount,
      sortOrder: line.sortOrder,
      createdBy: actors.createdBy,
      updatedBy: actors.updatedBy,
    }));
  }

  private async requireContact(id: string): Promise<CrmContact> {
    const contact = await this.contacts.readOne({ id });
    if (!contact || contact.isActive !== 1) {
      throw new HttpError(404, "Contact not found");
    }
    return contact;
  }
}

type InvoiceTotalsLines = ReturnType<typeof computeInvoice>["lines"];

function lineInput(line: LineSource): InvoiceLineInput {
  return {
    description: line.description,
    quantity: line.quantity,
    unitPrice: line.unitPrice,
  };
}

export const invoiceService = new InvoiceService();
