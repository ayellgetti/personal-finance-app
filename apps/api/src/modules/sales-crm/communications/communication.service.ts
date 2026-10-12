import { Prisma, type CrmChannel, type CrmContact, type CrmMessage, type User } from "@prisma/client";
import { HttpError } from "../../../utils/http-error.util";
import {
  crmContactModel,
  crmMessageModel,
  crmMessageTemplateModel,
  userModel,
  userRoleModel,
  type CrmContactModel,
  type CrmMessageModel,
  type CrmMessageTemplateModel,
  type UserModel,
  type UserRoleModel,
} from "../../../models/index";
import { crmEmailSchema, crmMobileSchema } from "../crm.request";
import { actorCreate, actorDelete, actorUpdate, requireActive } from "../crm.util";
import { channelDeliverer, type ChannelDeliverer } from "./communication.delivery";
import type {
  CreateMessageBody,
  CreateTemplateBody,
  ListMessagesQuery,
  ListNotificationsQuery,
  ListTemplatesQuery,
  RemoveMessageBody,
  RemoveTemplateBody,
  UpdateMessageBody,
  UpdateTemplateBody,
} from "./communication.request";
import { renderMessage } from "./message.template";

const PAST_SKEW_MS = 60_000;
const MAX_HORIZON_MS = 366 * 24 * 60 * 60 * 1000;
const STALE_SENDING_MS = 2 * 60 * 1000;
const SMS_MAX = 1000;

type StaffUser = Pick<User, "id" | "firstName" | "lastName" | "email" | "mobileNo" | "isActive">;

function mergedVariables(
  contact: Pick<CrmContact, "name" | "mobile" | "email" | "companyName"> | null,
  user: StaffUser | null,
  provided: Record<string, string> | undefined,
): Record<string, string> {
  const base: Record<string, string> = {};
  if (contact) {
    base.name = contact.name;
    base.mobile = contact.mobile;
    base.email = contact.email ?? "";
    base.company = contact.companyName ?? "";
  }
  if (user) {
    const staffName = `${user.firstName} ${user.lastName}`.trim();
    base.staffName = staffName;
    base.staffEmail = user.email;
    if (!base.name) base.name = staffName;
    if (!base.email) base.email = user.email;
    if (!base.mobile) base.mobile = user.mobileNo;
  }
  return { ...base, ...(provided ?? {}) };
}

function assertContent(channel: CrmChannel, subject: string | null, body: string) {
  if (!body) {
    throw new HttpError(400, "Write a message or choose a template");
  }
  if (channel !== "sms" && !subject) {
    throw new HttpError(400, "A subject is required");
  }
  if (channel === "sms" && body.length > SMS_MAX) {
    throw new HttpError(400, "SMS messages must be 1000 characters or fewer");
  }
}

export class CommunicationService {
  constructor(
    private readonly templates: CrmMessageTemplateModel = crmMessageTemplateModel,
    private readonly messages: CrmMessageModel = crmMessageModel,
    private readonly contacts: CrmContactModel = crmContactModel,
    private readonly users: UserModel = userModel,
    private readonly memberships: UserRoleModel = userRoleModel,
    private readonly deliver: ChannelDeliverer = channelDeliverer,
    private readonly now: () => Date = () => new Date(),
  ) {}

  async listTemplates(query: ListTemplatesQuery) {
    const where: Prisma.CrmMessageTemplateWhereInput = { isActive: 1 };
    if (query.channel) where.channel = query.channel;
    if (query.search) {
      where.OR = [
        { name: { contains: query.search, mode: "insensitive" } },
        { subject: { contains: query.search, mode: "insensitive" } },
        { body: { contains: query.search, mode: "insensitive" } },
      ];
    }
    return this.templates.paginate(where, query.page ?? 1, query.limit ?? 25, {
      orderBy: { name: "asc" },
    });
  }

  async getTemplate(id: string) {
    return requireActive(await this.templates.readOne({ id }), "Template");
  }

  async createTemplate(userId: string, input: CreateTemplateBody) {
    await this.assertTemplateName(input.name);
    const subject = input.channel === "sms" ? null : (input.subject ?? null);
    return this.templates.create({
      name: input.name,
      channel: input.channel,
      subject,
      body: input.body,
      ...actorCreate(userId),
    });
  }

  async updateTemplate(userId: string, id: string, input: UpdateTemplateBody) {
    const existing = await this.getTemplate(id);
    const channel = input.channel ?? existing.channel;
    const subject = input.subject !== undefined ? input.subject : existing.subject;
    const body = input.body ?? existing.body;
    if (channel === "sms" && subject) {
      throw new HttpError(400, "SMS templates do not use a subject");
    }
    if (channel !== "sms" && !subject) {
      throw new HttpError(400, "A subject is required");
    }
    if (input.name && input.name !== existing.name) {
      await this.assertTemplateName(input.name);
    }
    return this.templates.update(
      { id },
      {
        ...(input.name ? { name: input.name } : {}),
        channel,
        subject: channel === "sms" ? null : subject,
        body,
        ...actorUpdate(userId),
      },
    );
  }

  async removeTemplate(userId: string, input: RemoveTemplateBody) {
    await this.getTemplate(input.id);
    await this.templates.update({ id: input.id }, actorDelete(userId));
    return { id: input.id };
  }

  async listRecipients() {
    const memberships = await this.memberships.read({ isActive: 1 }, { take: 200 });
    const ids = [...new Set(memberships.map((row) => row.userId))];
    if (ids.length === 0) return { items: [] };
    const users = await this.users.read({ id: { in: ids }, isActive: 1 }, { take: 200 });
    return {
      items: users.map((user) => ({
        id: user.id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
      })),
    };
  }

  async listMessages(query: ListMessagesQuery) {
    const where: Prisma.CrmMessageWhereInput = { isActive: 1 };
    if (query.channel) where.channel = query.channel;
    if (query.status) where.status = query.status;
    if (query.contactId) where.contactId = query.contactId;
    if (query.search) {
      where.OR = [
        { subject: { contains: query.search, mode: "insensitive" } },
        { body: { contains: query.search, mode: "insensitive" } },
        { toAddress: { contains: query.search, mode: "insensitive" } },
      ];
    }
    return this.messages.paginate(where, query.page ?? 1, query.limit ?? 25, {
      orderBy: { scheduledAt: "desc" },
    });
  }

  async getMessage(id: string) {
    return requireActive(await this.messages.readOne({ id }), "Message");
  }

  async createMessage(userId: string, input: CreateMessageBody) {
    if (input.templateId && (input.subject || input.body)) {
      throw new HttpError(400, "Use a template or write the message, not both");
    }
    const template = input.templateId ? await this.getTemplate(input.templateId) : null;
    if (template && template.channel !== input.channel) {
      throw new HttpError(400, "Template channel does not match");
    }
    const contact = input.contactId
      ? requireActive(await this.contacts.readOne({ id: input.contactId }), "Contact")
      : null;
    const recipient = input.recipientUserId
      ? requireActive(await this.users.findById(input.recipientUserId), "User")
      : null;
    if (input.channel === "in_app") {
      if (!recipient) {
        throw new HttpError(400, "Choose a staff recipient for an in-app notification");
      }
      await this.assertCrmMember(recipient.id, "In-app notifications can only be sent to CRM staff");
    }

    const variables = mergedVariables(contact, recipient, input.variables);
    const sourceSubject = template ? template.subject : (input.subject ?? null);
    const sourceBody = template ? template.body : (input.body ?? "");
    const subject = sourceSubject ? renderMessage(sourceSubject, variables).trim() || null : null;
    const body = renderMessage(sourceBody, variables).trim();
    const storedSubject = input.channel === "sms" ? null : subject;
    assertContent(input.channel, storedSubject, body);
    const toAddress = this.resolveAddress(input.channel, input.toAddress, contact, recipient);
    const scheduledAt = this.scheduleTime(input.scheduledAt);

    const created = await this.messages.create({
      channel: input.channel,
      templateId: template?.id ?? null,
      subject: storedSubject,
      body,
      contactId: contact?.id ?? null,
      recipientUserId: recipient?.id ?? null,
      toAddress,
      variables: variables as Prisma.InputJsonValue,
      scheduledAt,
      status: "scheduled",
      sentAt: null,
      errorMessage: null,
      read: 0,
      readAt: null,
      ...actorCreate(userId),
    });

    if (scheduledAt.getTime() <= this.now().getTime()) {
      return (await this.dispatchOne(created.id)) ?? created;
    }
    return created;
  }

  async updateMessage(userId: string, id: string, input: UpdateMessageBody) {
    const existing = await this.getMessage(id);
    if (existing.status !== "scheduled") {
      throw new HttpError(409, "Only a scheduled message can be changed");
    }
    const variables = input.variables ?? {};
    const subject =
      input.subject !== undefined
        ? input.subject
          ? renderMessage(input.subject, variables).trim() || null
          : null
        : existing.subject;
    const body = input.body !== undefined ? renderMessage(input.body, variables).trim() : existing.body;
    const storedSubject = existing.channel === "sms" ? null : subject;
    assertContent(existing.channel, storedSubject, body);
    const toAddress =
      input.toAddress !== undefined
        ? this.resolveAddress(existing.channel, input.toAddress, null, null)
        : existing.toAddress;
    const scheduledAt = input.scheduledAt ? this.scheduleTime(input.scheduledAt) : existing.scheduledAt;

    const changed = await this.messages.updateMany(
      { id, isActive: 1, status: "scheduled" },
      {
        subject: storedSubject,
        body,
        toAddress,
        scheduledAt,
        ...(input.variables ? { variables: input.variables as Prisma.InputJsonValue } : {}),
        ...actorUpdate(userId),
      },
    );
    if (changed !== 1) {
      throw new HttpError(409, "Only a scheduled message can be changed");
    }
    const saved = await this.getMessage(id);
    if (saved.scheduledAt.getTime() <= this.now().getTime()) {
      return (await this.dispatchOne(saved.id)) ?? saved;
    }
    return saved;
  }

  async cancelMessage(userId: string, id: string) {
    const existing = await this.getMessage(id);
    if (existing.status === "sending") {
      throw new HttpError(409, "Message is already being sent");
    }
    const changed = await this.messages.updateMany(
      { id, isActive: 1, status: "scheduled" },
      { status: "cancelled", ...actorUpdate(userId) },
    );
    if (changed !== 1) {
      throw new HttpError(409, "Only a scheduled message can be cancelled");
    }
    return this.getMessage(id);
  }

  async removeMessage(userId: string, input: RemoveMessageBody) {
    const existing = await this.getMessage(input.id);
    if (existing.status === "sending") {
      throw new HttpError(409, "Message is already being sent");
    }
    await this.messages.update(
      { id: input.id },
      {
        ...(existing.status === "scheduled" ? { status: "cancelled" as const } : {}),
        ...actorDelete(userId),
      },
    );
    return { id: input.id };
  }

  async inbox(userId: string, query: ListNotificationsQuery) {
    await this.assertCrmMember(userId);
    const where: Prisma.CrmMessageWhereInput = {
      isActive: 1,
      channel: "in_app",
      recipientUserId: userId,
      status: "sent",
    };
    if (query.unread === "1") where.read = 0;
    return this.messages.paginate(where, query.page ?? 1, query.limit ?? 25, {
      orderBy: { sentAt: "desc" },
    });
  }

  async markRead(userId: string, id: string) {
    await this.assertCrmMember(userId);
    const existing = requireActive(await this.messages.readOne({ id }), "Notification");
    if (
      existing.channel !== "in_app" ||
      existing.recipientUserId !== userId ||
      existing.status !== "sent"
    ) {
      throw new HttpError(404, "Notification not found");
    }
    if (existing.read === 1) return existing;
    return this.messages.update(
      { id },
      { read: 1, readAt: this.now(), ...actorUpdate(userId) },
    );
  }

  async dispatchDue(): Promise<number> {
    const now = this.now();
    const staleBefore = new Date(now.getTime() - STALE_SENDING_MS);
    const scheduled = await this.messages.read(
      { isActive: 1, status: "scheduled", scheduledAt: { lte: now } },
      { orderBy: { scheduledAt: "asc" }, take: 25 },
    );
    const stuck = await this.messages.read(
      { isActive: 1, status: "sending", updatedAt: { lte: staleBefore } },
      { orderBy: { updatedAt: "asc" }, take: 25 },
    );
    const ids: string[] = [];
    for (const row of [...scheduled, ...stuck]) {
      if (!ids.includes(row.id)) ids.push(row.id);
      if (ids.length >= 25) break;
    }
    let delivered = 0;
    for (const id of ids) {
      const result = await this.dispatchOne(id);
      if (result?.status === "sent") delivered += 1;
    }
    return delivered;
  }

  private async dispatchOne(id: string): Promise<CrmMessage | null> {
    const now = this.now();
    const staleBefore = new Date(now.getTime() - STALE_SENDING_MS);
    const claimed = await this.claim(id, now, staleBefore);
    if (!claimed) return this.messages.readOne({ id });
    const message = await this.messages.readOne({ id });
    if (!message || message.isActive !== 1) return message;
    try {
      await this.deliverMessage(message);
      return this.messages.update(
        { id },
        { status: "sent", sentAt: now, errorMessage: null, updatedBy: "system" },
      );
    } catch (error) {
      const reason = error instanceof Error ? error.message.slice(0, 240) : "Delivery failed";
      return this.messages.update(
        { id },
        { status: "failed", errorMessage: reason, updatedBy: "system" },
      );
    }
  }

  private async claim(id: string, now: Date, staleBefore: Date): Promise<boolean> {
    const claimed = await this.messages.updateMany(
      { id, isActive: 1, status: "scheduled", scheduledAt: { lte: now } },
      { status: "sending", updatedBy: "system" },
    );
    if (claimed === 1) return true;
    const reclaimed = await this.messages.updateMany(
      { id, isActive: 1, status: "sending", updatedAt: { lte: staleBefore } },
      { status: "sending", updatedBy: "system", updatedAt: now },
    );
    return reclaimed === 1;
  }

  private async deliverMessage(message: CrmMessage): Promise<void> {
    if (message.channel === "in_app") return;
    if (!message.toAddress) {
      throw new Error(message.channel === "email" ? "Email is incomplete" : "SMS is incomplete");
    }
    if (message.channel === "email") {
      if (!message.subject) throw new Error("Email is incomplete");
      await this.deliver.sendEmail({
        to: message.toAddress,
        subject: message.subject,
        text: message.body,
      });
      return;
    }
    await this.deliver.sendSms({ to: message.toAddress, text: message.body });
  }

  private scheduleTime(value: Date | undefined): Date {
    const now = this.now();
    if (!value || value.getTime() <= now.getTime()) {
      if (value && value.getTime() < now.getTime() - PAST_SKEW_MS) {
        throw new HttpError(400, "Schedule time must be now or in the future");
      }
      return now;
    }
    if (value.getTime() > now.getTime() + MAX_HORIZON_MS) {
      throw new HttpError(400, "Schedule time must be within a year");
    }
    return value;
  }

  private resolveAddress(
    channel: CrmChannel,
    explicit: string | undefined,
    contact: Pick<CrmContact, "email" | "mobile"> | null,
    user: Pick<User, "email" | "mobileNo"> | null,
  ): string | null {
    if (channel === "in_app") return null;
    const raw =
      explicit?.trim() ||
      (channel === "email" ? contact?.email || user?.email : contact?.mobile || user?.mobileNo) ||
      "";
    if (!raw) {
      throw new HttpError(
        400,
        channel === "email" ? "An email address is required" : "A mobile number is required",
      );
    }
    if (channel === "email" && !crmEmailSchema.safeParse(raw).success) {
      throw new HttpError(400, "Invalid email address");
    }
    if (channel === "sms" && !crmMobileSchema.safeParse(raw).success) {
      throw new HttpError(400, "Invalid mobile number");
    }
    return raw;
  }

  private async assertCrmMember(userId: string, message = "Forbidden") {
    const membership = await this.memberships.findOne({ userId, isActive: 1 });
    if (!membership) {
      throw new HttpError(message === "Forbidden" ? 403 : 400, message);
    }
  }

  private async assertTemplateName(name: string) {
    const existing = await this.templates.findOne({ name, isActive: 1 });
    if (existing) {
      throw new HttpError(409, "A template with this name already exists");
    }
  }
}

export const communicationService = new CommunicationService();
