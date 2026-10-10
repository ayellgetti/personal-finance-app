import { describe, expect, it } from "vitest";
import { compareNumber, compareText, compareTime } from "@/lib/mobile/sort";

describe("list sort", () => {
  it("orders text and keeps blanks last", () => {
    expect(compareText("b", "a", "asc")).toBeGreaterThan(0);
    expect(compareText("b", "a", "desc")).toBeLessThan(0);
    expect(compareText("", "a", "asc")).toBeGreaterThan(0);
    expect(compareText("", "a", "desc")).toBeGreaterThan(0);
  });

  it("orders times and keeps missing dates last", () => {
    expect(compareTime("2026-01-02T00:00:00.000Z", "2026-01-01T00:00:00.000Z", "asc")).toBeGreaterThan(0);
    expect(compareTime("2026-01-02T00:00:00.000Z", "2026-01-01T00:00:00.000Z", "desc")).toBeLessThan(0);
    expect(compareTime(null, "2026-01-01T00:00:00.000Z", "desc")).toBeGreaterThan(0);
  });

  it("orders numbers and keeps missing amounts last", () => {
    expect(compareNumber(2, 10, "asc")).toBeLessThan(0);
    expect(compareNumber(2, 10, "desc")).toBeGreaterThan(0);
    expect(compareNumber(null, 1, "asc")).toBeGreaterThan(0);
  });
});
