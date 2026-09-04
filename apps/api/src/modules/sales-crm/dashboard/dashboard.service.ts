import { CRM_CONTACT_TYPES, CRM_TASK_STATUSES, OPEN_ENQUIRY_STATUSES } from "../crm.request";
import {
  crmContactModel,
  crmEnquiryModel,
  crmFollowUpModel,
  crmPaymentModel,
  crmTaskModel,
  type CrmContactModel,
  type CrmEnquiryModel,
  type CrmFollowUpModel,
  type CrmPaymentModel,
  type CrmTaskModel,
} from "../../../models/index";

export type DashboardSnapshot = {
  contactsByType: Record<(typeof CRM_CONTACT_TYPES)[number], number>;
  enquiries: {
    open: number;
    closed: number;
  };
  overdueFollowUps: number;
  paymentsPaidThisMonth: number;
  tasksByStatus: Record<(typeof CRM_TASK_STATUSES)[number], number>;
};

export class DashboardService {
  constructor(
    private readonly contacts: CrmContactModel = crmContactModel,
    private readonly enquiries: CrmEnquiryModel = crmEnquiryModel,
    private readonly followUps: CrmFollowUpModel = crmFollowUpModel,
    private readonly payments: CrmPaymentModel = crmPaymentModel,
    private readonly tasks: CrmTaskModel = crmTaskModel,
  ) {}

  async get(now = new Date()): Promise<DashboardSnapshot> {
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 1);

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
      overdueFollowUps,
      paymentsPaidThisMonth,
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
        status: { in: [...OPEN_ENQUIRY_STATUSES] },
      }),
      this.enquiries.count({ isActive: 1, status: "closed" }),
      this.followUps.count({
        isActive: 1,
        dueAt: { lt: now },
      }),
      this.payments.sumAmount({
        isActive: 1,
        status: "paid",
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
      overdueFollowUps,
      paymentsPaidThisMonth,
      tasksByStatus,
    };
  }
}

export const dashboardService = new DashboardService();
