import { CRM_ENQUIRY_SOURCES } from "@/lib/crm/display";

export const TRAVEL_TRIP_TYPES = [
  "Leisure",
  "Honeymoon",
  "Family",
  "Corporate",
  "Pilgrimage",
  "Adventure",
  "Other",
] as const;

export const TRAVEL_DESTINATIONS = [
  "Goa",
  "Kerala",
  "Kashmir",
  "Rajasthan",
  "Andaman",
  "International",
  "Other",
] as const;

export const TRAVEL_BUDGETS = [
  "Under ₹50,000",
  "₹50,000–1 lakh",
  "₹1–2 lakh",
  "₹2–5 lakh",
  "₹5–10 lakh",
  "₹10 lakh+",
] as const;

export const TRAVEL_CLASSES = ["Economy", "Premium economy", "Business", "First"] as const;

export const TRAVEL_ACCOMMODATION = [
  "Hotel 3-star",
  "Hotel 5-star",
  "Resort",
  "Homestay",
  "Custom",
] as const;

export const TRAVEL_SOURCES = CRM_ENQUIRY_SOURCES;

export type PublicTravelEnquiryInput = {
  kind: "travel";
  name: string;
  mobile: string;
  tripType: string;
  destination: string;
  departureDate: string;
  returnDate?: string;
  travelerCount: number;
  source: string;
  budget?: string;
  travelClass?: string;
  accommodation?: string;
  notes?: string;
};
