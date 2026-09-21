import { CRM_EVENT_SLOTS, type CrmEventSlot } from "@/types/crm";
import { CRM_ENQUIRY_SOURCES } from "@/lib/crm/display";

export const BANQUET_EVENT_TYPES = [
  "Wedding Ceremony & Reception",
  "Engagement Ceremony",
  "Sangeet",
  "Mehendi",
  "Haldi",
  "Birthday",
  "Anniversary",
  "Retirement Party",
  "Naming Ceremony",
  "Baby Shower",
  "Bridal Shower",
  "Kitty Party",
  "Karaoke Night",
  "Garba",
  "Dance Practice",
  "Preschool",
  "School Annual Day",
  "Corporate Event (Meeting, Conference, Gala)",
  "Corporate Gala",
  "Awards Dinner",
  "Seminar",
  "AGM",
  "Society Meeting",
  "Re-Development Meeting",
  "Charity Event",
  "Fundraiser Event",
  "Other",
] as const;

export const BANQUET_VENUES = [
  "Main Banquet Hall",
  "Lawn",
  "Poolside",
  "Conference room",
] as const;

export const BANQUET_BUDGETS = [
  "Under ₹1 lakh",
  "₹1–2 lakh",
  "₹2–5 lakh",
  "₹5–10 lakh",
  "₹10 lakh+",
] as const;

export const BANQUET_MENUS = [
  "Veg deluxe",
  "Non-veg deluxe",
  "Mix deluxe",
  "Custom",
] as const;

export const BANQUET_DECORATIONS = [
  "Floral",
  "Stage + entrance",
  "Minimal",
  "Custom",
] as const;

export const BANQUET_TIME_SLOTS = CRM_EVENT_SLOTS;
export const BANQUET_SOURCES = CRM_ENQUIRY_SOURCES;

export type PublicBanquetEnquiryInput = {
  kind?: "banquet";
  name: string;
  mobile: string;
  eventType: string;
  eventDate: string;
  timeSlot: CrmEventSlot;
  guestCount: number;
  source: string;
  venue?: string;
  budget?: string;
  menu?: string;
  decoration?: string;
  notes?: string;
};

export type PublicEnquiryInput = PublicBanquetEnquiryInput;
