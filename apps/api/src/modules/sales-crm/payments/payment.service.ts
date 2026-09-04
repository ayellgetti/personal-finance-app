import { Prisma } from "@prisma/client";
import { HttpError } from "../../../utils/http-error.util";
import {
  crmClientModel,
  crmEnquiryModel,
  crmPaymentModel,
  type CrmClientModel,
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
  ) {}

  list(query: ListPaymentsQuery) {
    const where: Prisma.CrmPaymentWhereInput = { isActive: 1 };
    if (query.clientId) {
      where.clientId = query.clientId;
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
    await this.requireActiveClient(input.clientId);
    if (input.enquiryId) {
      await this.requireActiveEnquiry(input.enquiryId);
    }
    return this.model.create({
      clientId: input.clientId,
      enquiryId: input.enquiryId ?? null,
      amount: input.amount,
      currency: input.currency ?? "INR",
      method: input.method,
      status: input.status ?? "pending",
      paidAt: input.paidAt ?? null,
      reference: input.reference ?? null,
      ...actorCreate(actorId),
    });
  }

  async update(actorId: string, id: string, input: UpdatePaymentBody) {
    await this.getById(id);
    if (input.clientId) {
      await this.requireActiveClient(input.clientId);
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

  private async requireActiveClient(clientId: string) {
    const client = await this.clients.readOne({ id: clientId });
    if (!client || client.isActive !== 1) {
      throw new HttpError(404, "Client not found");
    }
    return client;
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
