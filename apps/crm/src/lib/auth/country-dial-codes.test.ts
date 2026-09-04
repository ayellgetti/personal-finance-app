import { describe, expect, it } from "vitest";
import { COUNTRY_DIAL_CODES, DEFAULT_COUNTRY_ISO, dialForIso, toE164Mobile } from "./country-dial-codes";

describe("COUNTRY_DIAL_CODES", () => {
  it("lists ISO countries with unique codes and India first", () => {
    const isos = COUNTRY_DIAL_CODES.map((country) => country.iso);
    expect(COUNTRY_DIAL_CODES[0]?.iso).toBe(DEFAULT_COUNTRY_ISO);
    expect(isos.length).toBeGreaterThanOrEqual(249);
    expect(new Set(isos).size).toBe(isos.length);
    expect(isos).toEqual(expect.arrayContaining(["IN", "US", "GB", "JP", "BR", "NG", "AE"]));
  });
});

describe("toE164Mobile", () => {
  it("prefixes the India ISD code", () => {
    expect(toE164Mobile("IN", "9876543210")).toBe("+919876543210");
  });

  it("returns the ISD dial for a country ISO", () => {
    expect(dialForIso("IN")).toBe("+91");
    expect(dialForIso("GB")).toBe("+44");
    expect(dialForIso("JP")).toBe("+81");
    expect(dialForIso("BR")).toBe("+55");
  });

  it("strips a leading trunk zero", () => {
    expect(toE164Mobile("GB", "07123456789")).toBe("+447123456789");
  });

  it("keeps an already international number", () => {
    expect(toE164Mobile("IN", "+14155552671")).toBe("+14155552671");
  });
});
