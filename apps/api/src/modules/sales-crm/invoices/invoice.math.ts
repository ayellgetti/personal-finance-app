export type InvoiceLineInput = {
  description: string;
  quantity: number;
  unitPrice: number;
};

export type ComputedInvoiceLine = InvoiceLineInput & {
  amount: number;
  sortOrder: number;
};

export type InvoiceTotals = {
  lines: ComputedInvoiceLine[];
  taxPercent: number;
  subtotal: number;
  taxAmount: number;
  total: number;
};

export function roundMoney(value: number): number {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

export function invoiceYearPrefix(issuedAt: Date): string {
  return `INV-${issuedAt.getFullYear()}-`;
}

export function formatInvoiceNumber(year: number, sequence: number): string {
  return `INV-${year}-${String(sequence).padStart(4, "0")}`;
}

export function sequenceFromInvoiceNumber(number: string, prefix: string): number {
  if (!number.startsWith(prefix)) return 0;
  const sequence = Number(number.slice(prefix.length));
  return Number.isInteger(sequence) && sequence > 0 ? sequence : 0;
}

export function computeInvoice(lines: InvoiceLineInput[], taxPercent: number): InvoiceTotals {
  const computed = lines.map((line, index) => ({
    description: line.description.trim(),
    quantity: line.quantity,
    unitPrice: roundMoney(line.unitPrice),
    amount: roundMoney(line.quantity * line.unitPrice),
    sortOrder: index,
  }));
  const subtotal = roundMoney(computed.reduce((sum, line) => sum + line.amount, 0));
  const taxAmount = roundMoney((subtotal * taxPercent) / 100);
  return {
    lines: computed,
    taxPercent,
    subtotal,
    taxAmount,
    total: roundMoney(subtotal + taxAmount),
  };
}
