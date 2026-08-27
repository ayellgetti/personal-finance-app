import { describe, expect, it } from "vitest";
import { dialForIso, toE164Mobile } from "./country-dial-codes";

describe("toE164Mobile", () => {
  it("prefixes the India ISD code", () => {
    expect(toE164Mobile("IN", "9876543210")).toBe("+919876543210");
  });

  it("returns the ISD dial for a country ISO", () => {
    expect(dialForIso("IN")).toBe("+91");
    expect(dialForIso("GB")).toBe("+44");
  });

  it("strips a leading trunk zero", () => {
    expect(toE164Mobile("GB", "07123456789")).toBe("+447123456789");
  });

  it("keeps an already international number", () => {
    expect(toE164Mobile("IN", "+14155552671")).toBe("+14155552671");
  });
});
