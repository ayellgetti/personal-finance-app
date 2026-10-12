import { Prisma, type CrmInvoice, type CrmInvoiceLine } from "@prisma/client";
import { prisma } from "../../utils/prisma.util";
import { PrismaModel } from "../prisma-model";

export type InvoiceLineWrite = {
  description: string;
  quantity: number;
  unitPrice: number;
  amount: number;
  sortOrder: number;
  createdBy?: string;
  updatedBy?: string;
};

export type InvoiceWithLines = CrmInvoice & { lines: CrmInvoiceLine[] };

const activeLines = { where: { isActive: 1 }, orderBy: { sortOrder: "asc" as const } };

export class CrmInvoiceModel extends PrismaModel<
  CrmInvoice,
  Prisma.CrmInvoiceUncheckedCreateInput,
  Prisma.CrmInvoiceUncheckedUpdateInput,
  Prisma.CrmInvoiceWhereInput,
  Prisma.CrmInvoiceWhereUniqueInput,
  Prisma.CrmInvoiceOrderByWithRelationInput
> {
  constructor() {
    super(prisma.crmInvoice, "CrmInvoice");
  }

  async highestSequence(prefix: string): Promise<number> {
    const like = `${prefix}%`;
    const rows = await prisma.$queryRaw<{ number: string }[]>(
      Prisma.sql`SELECT "number" FROM "CrmInvoice" WHERE "number" LIKE ${like} ORDER BY LENGTH("number") DESC, "number" DESC LIMIT 1`,
    );
    const number = rows[0]?.number;
    if (!number?.startsWith(prefix)) return 0;
    const sequence = Number(number.slice(prefix.length));
    return Number.isInteger(sequence) && sequence > 0 ? sequence : 0;
  }

  async insertDocument(
    header: Prisma.CrmInvoiceUncheckedCreateInput,
    lines: InvoiceLineWrite[],
  ): Promise<InvoiceWithLines> {
    return prisma.$transaction(async (tx) => {
      const invoice = await tx.crmInvoice.create({ data: header });
      if (lines.length > 0) {
        await tx.crmInvoiceLine.createMany({
          data: lines.map((line) => ({ ...line, invoiceId: invoice.id })),
        });
      }
      const stored = await tx.crmInvoiceLine.findMany({
        where: { invoiceId: invoice.id, isActive: 1 },
        orderBy: activeLines.orderBy,
      });
      return { ...invoice, lines: stored };
    });
  }

  async replaceDocument(
    id: string,
    header: Prisma.CrmInvoiceUncheckedUpdateInput,
    lines: InvoiceLineWrite[],
    retired: Prisma.CrmInvoiceLineUncheckedUpdateManyInput,
  ): Promise<InvoiceWithLines> {
    return prisma.$transaction(async (tx) => {
      const invoice = await tx.crmInvoice.update({ where: { id }, data: header });
      await tx.crmInvoiceLine.updateMany({
        where: { invoiceId: id, isActive: 1 },
        data: retired,
      });
      if (lines.length > 0) {
        await tx.crmInvoiceLine.createMany({
          data: lines.map((line) => ({ ...line, invoiceId: id })),
        });
      }
      const stored = await tx.crmInvoiceLine.findMany({
        where: { invoiceId: id, isActive: 1 },
        orderBy: activeLines.orderBy,
      });
      return { ...invoice, lines: stored };
    });
  }

  async deactivate(id: string, data: Prisma.CrmInvoiceUncheckedUpdateInput): Promise<CrmInvoice> {
    return prisma.$transaction(async (tx) => {
      await tx.crmInvoiceLine.updateMany({
        where: { invoiceId: id, isActive: 1 },
        data,
      });
      return tx.crmInvoice.update({ where: { id }, data });
    });
  }
}

export class CrmInvoiceLineModel extends PrismaModel<
  CrmInvoiceLine,
  Prisma.CrmInvoiceLineUncheckedCreateInput,
  Prisma.CrmInvoiceLineUncheckedUpdateInput,
  Prisma.CrmInvoiceLineWhereInput,
  Prisma.CrmInvoiceLineWhereUniqueInput,
  Prisma.CrmInvoiceLineOrderByWithRelationInput
> {
  constructor() {
    super(prisma.crmInvoiceLine, "CrmInvoiceLine");
  }
}

export const crmInvoiceModel = new CrmInvoiceModel();
export const crmInvoiceLineModel = new CrmInvoiceLineModel();
