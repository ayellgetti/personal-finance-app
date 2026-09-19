import { CRM_CONTACT_TYPES, CRM_TASK_STATUSES, OPEN_ENQUIRY_STATUSES } from "../crm.request";
import {
  crmContactModel,
  crmEnquiryModel,
  crmPaymentModel,
  crmTaskModel,
  type CrmContactModel,
  type CrmEnquiryModel,
  type CrmPaymentModel,
  type CrmTaskModel,
} from "../../../models/index";

export type DashboardDueEnquiry = {
  id: string;
  title: string;
  dueDate: Date | null;
  contactId: string;
};

export type DashboardSnapshot = {
  contactsByType: Record<(typeof CRM_CONTACT_TYPES)[number], number>;
  enquiries: {
    open: number;
    closed: number;
  };
  leadsGeneratedToday: number;
  customerDueToday: number;
  customerDueItems: DashboardDueEnquiry[];
  overdueFollowUps: number;
  followUpsToday: number;
  paymentsPaidThisMonth: number;
  paymentsIncomeThisMonth: number;
  paymentsExpenseThisMonth: number;
  tasksByStatus: Record<(typeof CRM_TASK_STATUSES)[number], number>;
};

export class DashboardService {
  constructor(
    private readonly contacts: CrmContactModel = crmContactModel,
    private readonly enquiries: CrmEnquiryModel = crmEnquiryModel,
    private readonly payments: CrmPaymentModel = crmPaymentModel,
    private readonly tasks: CrmTaskModel = crmTaskModel,
  ) {}

  async get(now = new Date()): Promise<DashboardSnapshot> {
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 1);
    const dayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const dayEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
    const openStatuses = [...OPEN_ENQUIRY_STATUSES];

    const contactsByType = Object.fromEntries(
      CRM_CONTACT_TYPES.map((type) => [type, 0]),
    ) as DashboardSnapshot["contactsByType"];
    const tasksByStatus = Object.fromEntries(
      CRM_TASK_STATUSES.map((status) => [status, 0]),
    ) as DashboardSnapshot["tasksByStatus"];

    const [
      contactCounts,
      openEnquiries,
      closedEnquiries,
      leadsGeneratedToday,
      customerDueRows,
      overdueFollowUps,
      followUpsToday,
      paymentsIncomeThisMonth,
      paymentsExpenseThisMonth,
      taskCounts,
    ] = await Promise.all([
      Promise.all(
        CRM_CONTACT_TYPES.map(async (type) => ({
          type,
          count: await this.contacts.count({ isActive: 1, type }),
        })),
      ),
      this.enquiries.count({
        isActive: 1,
        status: { in: openStatuses },
      }),
      this.enquiries.count({ isActive: 1, status: "closed" }),
      this.enquiries.count({
        isActive: 1,
        createdAt: { gte: dayStart, lt: dayEnd },
      }),
      this.enquiries.read({
        isActive: 1,
        status: { in: openStatuses },
        dueDate: { gte: dayStart, lt: dayEnd },
      }),
      this.enquiries.count({
        isActive: 1,
        status: { in: openStatuses },
        nextFollowupDate: { lt: now },
      }),
      this.enquiries.count({
        isActive: 1,
        status: { in: openStatuses },
        nextFollowupDate: { gte: dayStart, lt: dayEnd },
      }),
      this.payments.sumAmount({
        isActive: 1,
        status: "paid",
        type: "INCOME",
        paidAt: { gte: monthStart, lt: monthEnd },
      }),
      this.payments.sumAmount({
        isActive: 1,
        status: "paid",
        type: "EXPENSE",
        paidAt: { gte: monthStart, lt: monthEnd },
      }),
      Promise.all(
        CRM_TASK_STATUSES.map(async (status) => ({
          status,
          count: await this.tasks.count({ isActive: 1, status }),
        })),
      ),
    ]);

    for (const row of contactCounts) {
      contactsByType[row.type] = row.count;
    }
    for (const row of taskCounts) {
      tasksByStatus[row.status] = row.count;
    }

    return {
      contactsByType,
      enquiries: {
        open: openEnquiries,
        closed: closedEnquiries,
      },
      leadsGeneratedToday,
      customerDueToday: customerDueRows.length,
      customerDueItems: customerDueRows.map((enquiry) => ({
        id: enquiry.id,
        title: enquiry.title,
        dueDate: enquiry.dueDate,
        contactId: enquiry.contactId,
      })),
      overdueFollowUps,
      followUpsToday,
      paymentsPaidThisMonth: paymentsIncomeThisMonth + paymentsExpenseThisMonth,
      paymentsIncomeThisMonth,
      paymentsExpenseThisMonth,
      tasksByStatus,
    };
  }
}

export const dashboardService = new DashboardService();
