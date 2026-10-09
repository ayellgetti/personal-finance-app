import { describe, expect, it } from "vitest";
import { formatInr, formatPercent, formatUpdated } from "./format";

describe("finance formatting", () => {
  it("uses Indian currency grouping", () => {
    expect(formatInr(1250000)).toContain("12,50,000");
  });

  it("keeps unknown values distinct from zero", () => {
    expect(formatInr(undefined)).toBe("Not available");
    expect(formatInr(0)).not.toBe("Not available");
  });

  it("formats percentages and missing timestamps", () => {
    expect(formatPercent(12.34)).toBe("12.3%");
    expect(formatUpdated(null)).toBe("Not updated yet");
  });
});
