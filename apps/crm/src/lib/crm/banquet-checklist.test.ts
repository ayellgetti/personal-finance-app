import { describe, expect, it } from "vitest";
import {
  buildWhatsAppHandoverMessage,
  whatsAppChatDigits,
  whatsAppHandoverUrl,
  type WhatsAppHandoverDraft,
} from "./banquet-checklist";

const emptyDraft: WhatsAppHandoverDraft = {
  clientName: "",
  mobileNo: "",
  menuPackage: "",
  eventDate: "",
  eventTime: "",
  guests: "",
  menu: [],
  decoration: "",
  payments: [],
  staff: [],
  instruction: "",
  remarks: "",
};

describe("WhatsApp handover message", () => {
  it("builds a short summary from filled checklist fields", () => {
    const message = buildWhatsAppHandoverMessage({
      ...emptyDraft,
      clientName: "Ramesh",
      mobileNo: "9876543210",
      menuPackage: "Gold",
      eventDate: "22 Sep 2026",
      eventTime: "Evening 04:00 PM – 10:00 PM",
      guests: "250",
      menu: [
        { category: "Welcome Drink", item: "Special Thandai (स्पेशल ठंडाई)", requirement: "" },
        { category: "Starter", item: "Hara Bhara Kabab (हरा भरा कबाब)", requirement: "Mint chutney" },
        { category: "Starter", item: "Paneer Chilli Dry (पनीर चिली ड्राई)", requirement: "" },
      ],
      decoration: "Stage backdrop",
      payments: [
        { particular: "Advance received", amount: "50000", mode: "UPI", remarks: "At booking" },
      ],
      staff: [{ role: "Waiters", quantity: "8", names: "Ravi, Sameer" }],
      instruction: "Jain thali for 12",
    });

    expect(message).toContain("*Event handover*");
    expect(message).toContain("Client: Ramesh");
    expect(message).toContain("Menu: Gold");
    expect(message).toContain("• Welcome Drink: Special Thandai (स्पेशल ठंडाई)");
    expect(message).toContain(
      "• Starter: Hara Bhara Kabab (हरा भरा कबाब) — Mint chutney; Paneer Chilli Dry (पनीर चिली ड्राई)",
    );
    expect(message).toContain("*Decoration*\nStage backdrop");
    expect(message).toContain("• Advance received: ₹50000 (UPI) — At booking");
    expect(message).toContain("• Waiters: 8 (Ravi, Sameer)");
    expect(message).toContain("*Instructions*\nJain thali for 12");
    expect(message).not.toContain("*Remarks*");
  });

  it("omits empty sections", () => {
    expect(buildWhatsAppHandoverMessage(emptyDraft)).toBe("*Event handover*");
  });

  it("builds a wa.me link for a 10-digit Indian mobile", () => {
    expect(whatsAppChatDigits("09876-543210")).toBe("919876543210");
    expect(whatsAppHandoverUrl("9876543210", "Hello")).toBe(
      "https://wa.me/919876543210?text=Hello",
    );
    expect(whatsAppHandoverUrl("", "Hello")).toBe("https://wa.me/?text=Hello");
  });
});
