import { fireEvent, render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import BanquetOrder from "./BanquetOrder";

function pick(row: number, name: string) {
  const input = screen.getByLabelText(`Order row ${row} product`);
  fireEvent.click(input);
  const list = document.getElementById(input.getAttribute("aria-controls") ?? "");
  if (!list) throw new Error("Product list is not open");
  fireEvent.click(within(list).getByRole("option", { name }));
}

describe("BanquetOrder", () => {
  it("lets the same product be ordered more than once and fills the category from search", () => {
    render(<BanquetOrder />);
    pick(1, "Paneer (पनीर) · kg");
    expect(screen.getByLabelText("Order row 1 category")).toHaveTextContent("Dairy Products");
    fireEvent.click(screen.getByRole("button", { name: "+ Add product" }));
    pick(2, "Paneer (पनीर) · kg");
    fireEvent.change(screen.getByLabelText("Order row 1 quantity"), { target: { value: "5" } });
    fireEvent.change(screen.getByLabelText("Order row 2 quantity"), { target: { value: "3" } });

    fireEvent.click(screen.getByRole("button", { name: "WhatsApp message" }));
    const message = within(screen.getByRole("dialog")).getByLabelText(
      "WhatsApp message",
    ) as HTMLTextAreaElement;
    expect(message.value).toContain("1. Paneer (पनीर) — 5 kg");
    expect(message.value).toContain("2. Paneer (पनीर) — 3 kg");
  });
});
