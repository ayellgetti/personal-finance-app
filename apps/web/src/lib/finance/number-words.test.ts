import { describe, expect, it } from "vitest";
import { amountToIndianRupeeWords, numberToIndianWords } from "./number-words";

describe("numberToIndianWords", () => {
  it("uses Indian lakh and crore units", () => {
    expect(numberToIndianWords(12_345_678)).toBe(
      "One Crore Twenty Three Lakh Forty Five Thousand Six Hundred Seventy Eight",
    );
  });

  it("formats rupee amounts for calculator cards", () => {
    expect(amountToIndianRupeeWords(100_000)).toBe("One Lakh Rupees");
    expect(amountToIndianRupeeWords(1_912_491)).toBe(
      "Nineteen Lakh Twelve Thousand Four Hundred Ninety One Rupees",
    );
  });
});
