import { describe, expect, it } from "vitest";
import { bestPrice, orderAmount, parsePriceRows, priceTemplateRows } from "./banquet-prices";

describe("vendor price import", () => {
  it("builds a template with one row per item and a column per vendor", () => {
    const rows = priceTemplateRows();
    expect(rows[0]).toEqual([
      "Category", "Item", "Unit", "Kisan Connect", "Country Delight", "Blinkit", "Zepto", "Jumbotail",
    ]);
    expect(rows.length).toBe(262);
  });

  it("reads prices by category and item, ignoring blanks and unknown rows", () => {
    const result = parsePriceRows([
      ["Vendor prices"],
      ["Category", "Item", "Unit", "Kisan Connect", "Blinkit", "Jumbotail"],
      ["Dairy Products", "Paneer", "kg", "", "₹420", 395],
      ["Dairy Products", "Milk", "ltr", "", "", ""],
      ["Dairy Products", "Unicorn Milk", "ltr", 10, "", ""],
      ["Oils & Fats", "Ghee", "kg", "1,100", "", ""],
    ]);
    expect(result.matched).toBe(2);
    expect(result.unmatched).toBe(1);
    expect(result.prices["dairy-products-paneer"]).toEqual({ Blinkit: 420, Jumbotail: 395 });
    expect(result.prices["oils-fats-ghee"]).toEqual({ "Kisan Connect": 1100 });
  });

  it("picks the cheapest vendor and prices a quantity with it", () => {
    const prices = { "dairy-products-paneer": { Blinkit: 420, Jumbotail: 395 } };
    expect(bestPrice(prices, "dairy-products-paneer")).toEqual({ vendor: "Jumbotail", price: 395 });
    expect(orderAmount(prices, "dairy-products-paneer", "12")).toBe(4740);
    expect(orderAmount(prices, "dairy-products-paneer", "")).toBeUndefined();
    expect(orderAmount(prices, "dairy-products-milk", "5")).toBeUndefined();
  });
});
