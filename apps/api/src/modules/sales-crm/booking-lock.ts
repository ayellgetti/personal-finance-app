import type { CrmEnquiry } from "@prisma/client";
import type {
  CrmCalendarEventModel,
  CrmClientModel,
  CrmPaymentModel,
} from "../../models/index";

export type BookingLockModels = {
  clients: CrmClientModel;
  events: CrmCalendarEventModel;
  payments: CrmPaymentModel;
};

/**
 * A converted enquiry and its booking are locked together once money is in:
 * removing either side would strand the paid payment.
 */
export async function isBookedAndPaid(
  enquiry: CrmEnquiry,
  models: BookingLockModels,
): Promise<boolean> {
  if (enquiry.status !== "closed" || enquiry.closedReason?.trim().toLowerCase() !== "booked") {
    return false;
  }
  const [client, booking] = await Promise.all([
    models.clients.findOne({ convertedFromEnquiryId: enquiry.id, isActive: 1 }),
    models.events.findOne({ enquiryId: enquiry.id, isActive: 1 }),
  ]);
  if (!client || !booking) {
    return false;
  }
  const payment = await models.payments.findOne({
    isActive: 1,
    status: "paid",
    OR: [{ enquiryId: enquiry.id }, { referenceType: "client", referenceId: client.id }],
  });
  return Boolean(payment);
}
