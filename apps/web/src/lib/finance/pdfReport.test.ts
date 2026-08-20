import { describe, expect, it } from "vitest";
import { pdfSafe } from "./pdfReport";

describe("pdfSafe", () => {
  it("converts rupee and dash characters jsPDF cannot encode", () => {
    expect(pdfSafe("Use ₹50,013 against the highest‑rate loan")).toBe(
      "Use Rs.50,013 against the highest-rate loan",
    );
  });
});
