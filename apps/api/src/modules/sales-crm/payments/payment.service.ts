import { Prisma, type CrmPaymentReferenceType } from "@prisma/client";
import { HttpError } from "../../../utils/http-error.util";
import {
  crmClientModel,
  crmContactModel,
  crmEnquiryModel,
  crmPaymentModel,
  type CrmClientModel,
  type CrmContactModel,
  type CrmEnquiryModel,
  type CrmPaymentModel,
} from "../../../models/index";
import { actorCreate, actorDelete, actorUpdate, requireActive } from "../crm.util";
import type {
  CreatePaymentBody,
  ListPaymentsQuery,
  RemovePaymentBody,
  UpdatePaymentBody,
} from "./payment.request";

export class PaymentService {
  constructor(
    private readonly model: CrmPaymentModel = crmPaymentModel,
    private readonly clients: CrmClientModel = crmClientModel,
    private readonly enquiries: CrmEnquiryModel = crmEnquiryModel,
    private readonly contacts: CrmContactModel = crmContactModel,
  ) {}

  list(query: ListPaymentsQuery) {
    const where: Prisma.CrmPaymentWhereInput = { isActive: 1 };
    if (query.referenceType) {
      where.referenceType = query.referenceType;
    }
    if (query.referenceId) {
      where.referenceId = query.referenceId;
    }
    if (query.status) {
      where.status = query.status;
    }
    if (query.from || query.to) {
      where.paidAt = {
        ...(query.from ? { gte: query.from } : {}),
        ...(query.to ? { lte: query.to } : {}),
      };
    }
    return this.model.paginate(where, query.page ?? 1, query.limit ?? 25, {
      orderBy: { createdAt: "desc" },
    });
  }

  async getById(id: string) {
    return requireActive(await this.model.readOne({ id }), "Payment");
  }

  async create(actorId: string, input: CreatePaymentBody) {
    await this.requireReference(input.referenceType, input.referenceId);
    if (input.enquiryId) {
      await this.requireActiveEnquiry(input.enquiryId);
    }
    return this.model.create({
      referenceType: input.referenceType,
      referenceId: input.referenceId,
      enquiryId: input.enquiryId ?? null,
      amount: input.amount,
      currency: input.currency ?? "INR",
      type: input.type ?? "INCOME",
      mode: input.mode,
      status: input.status ?? "pending",
      paidAt: input.paidAt ?? null,
      reference: input.reference ?? null,
      ...actorCreate(actorId),
    });
  }

  async update(actorId: string, id: string, input: UpdatePaymentBody) {
    const existing = await this.getById(id);
    const nextReferenceType = input.referenceType ?? existing.referenceType;
    const nextReferenceId = input.referenceId ?? existing.referenceId;
    if (input.referenceType || input.referenceId) {
      await this.requireReference(nextReferenceType, nextReferenceId);
    }
    if (input.enquiryId) {
      await this.requireActiveEnquiry(input.enquiryId);
    }
    return this.model.update(
      { id },
      {
        ...input,
        ...actorUpdate(actorId),
      },
    );
  }

  async remove(actorId: string, input: RemovePaymentBody) {
    await this.getById(input.id);
    await this.model.update({ id: input.id }, actorDelete(actorId));
    return { id: input.id, removed: true };
  }

  private async requireReference(referenceType: CrmPaymentReferenceType, referenceId: string) {
    if (referenceType === "client") {
      return this.requireActiveClient(referenceId);
    }
    return this.requireVendorContact(referenceId);
  }

  private async requireActiveClient(clientId: string) {
    const client = await this.clients.readOne({ id: clientId });
    if (!client || client.isActive !== 1) {
      throw new HttpError(404, "Client not found");
    }
    return client;
  }

  private async requireVendorContact(vendorContactId: string) {
    const contact = await this.contacts.readOne({ id: vendorContactId });
    if (!contact || contact.isActive !== 1) {
      throw new HttpError(404, "Vendor not found");
    }
    if (contact.type !== "vendor") {
      throw new HttpError(422, "Payee contact must be a vendor");
    }
    return contact;
  }

  private async requireActiveEnquiry(enquiryId: string) {
    const enquiry = await this.enquiries.readOne({ id: enquiryId });
    if (!enquiry || enquiry.isActive !== 1) {
      throw new HttpError(404, "Enquiry not found");
    }
    return enquiry;
  }
}

export const paymentService = new PaymentService();
