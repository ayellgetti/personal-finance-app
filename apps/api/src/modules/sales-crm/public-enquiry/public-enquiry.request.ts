import { z } from "zod";
import { crmEventSlotSchema, crmMobileSchema } from "../crm.request";

export const PUBLIC_ENQUIRY_ACTOR = "public";

const optionalLabel = z.string().trim().max(80).optional();
const requiredDate = z.coerce.date().refine((value) => !Number.isNaN(value.getTime()), {
  message: "Invalid date",
});

const publicContactFields = {
  name: z.string().trim().min(1).max(120),
  mobile: crmMobileSchema,
  source: z.string().trim().min(1).max(80),
  budget: optionalLabel,
  notes: z.string().trim().max(4000).optional(),
};

export const createBanquetPublicEnquiryBodySchema = z.object({
  kind: z.literal("banquet").default("banquet"),
  ...publicContactFields,
  eventType: z.string().trim().min(1).max(80),
  eventDate: requiredDate,
  timeSlot: crmEventSlotSchema,
  guestCount: z.coerce.number().int().min(1).max(10000),
  venue: optionalLabel,
  menu: optionalLabel,
  decoration: optionalLabel,
});

export const createTravelPublicEnquiryBodySchema = z
  .object({
    kind: z.literal("travel"),
    ...publicContactFields,
    tripType: z.string().trim().min(1).max(80),
    destination: z.string().trim().min(1).max(80),
    departureDate: requiredDate,
    returnDate: requiredDate.optional(),
    travelerCount: z.coerce.number().int().min(1).max(10000),
    travelClass: optionalLabel,
    accommodation: optionalLabel,
  })
  .superRefine((value, ctx) => {
    if (value.returnDate && value.returnDate.getTime() < value.departureDate.getTime()) {
      ctx.addIssue({
        code: "custom",
        message: "Return date must be on or after the departure date",
        path: ["returnDate"],
      });
    }
  });

export const createPublicEnquiryBodySchema = z.union([
  createTravelPublicEnquiryBodySchema,
  createBanquetPublicEnquiryBodySchema,
]);

export type CreateBanquetPublicEnquiryBody = z.infer<typeof createBanquetPublicEnquiryBodySchema>;
export type CreateTravelPublicEnquiryBody = z.infer<typeof createTravelPublicEnquiryBodySchema>;
export type CreatePublicEnquiryBody = z.infer<typeof createPublicEnquiryBodySchema>;
