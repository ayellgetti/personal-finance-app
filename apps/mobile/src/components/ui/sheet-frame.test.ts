import { describe, expect, it } from "vitest";
import { bottomSheetFrame } from "@/components/ui/sheet-frame";

describe("bottomSheetFrame", () => {
  it("leaves a strip of the page above a tall phone sheet", () => {
    expect(bottomSheetFrame(800, 0, 800)).toEqual({ bottom: 0, maxHeight: 728 });
  });

  it("lifts the sheet above the keyboard and keeps the header in view", () => {
    expect(bottomSheetFrame(800, 0, 420)).toEqual({ bottom: 380, maxHeight: 348 });
  });

  it("keeps the header below the browser chrome", () => {
    expect(bottomSheetFrame(800, 100, 640)).toEqual({ bottom: 60, maxHeight: 568 });
  });

  it("still leaves a tap target on a very short screen", () => {
    const frame = bottomSheetFrame(320, 0, 220);
    expect(frame).toEqual({ bottom: 100, maxHeight: 172 });
    expect(220 - frame.maxHeight).toBeGreaterThanOrEqual(48);
  });
});
