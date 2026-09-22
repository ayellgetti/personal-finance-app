/** @vitest-environment jsdom */
import { fireEvent, render, screen, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import {
  BANQUET_CHECKLIST_CATEGORIES,
  BANQUET_EVENT_TIMES,
  BANQUET_MENU_PACKAGES,
  BANQUET_PAYMENT_MODES,
  BANQUET_PAYMENT_PARTICULARS,
  BANQUET_STAFF_ROLES,
  checklistItemGroups,
  packageRowCount,
  packagedCategories,
} from "@/lib/crm/banquet-checklist";
import BanquetChecklist from "./BanquetChecklist";

vi.mock("sonner", () => {
  const toast = Object.assign(vi.fn(), {
    success: vi.fn(),
    error: vi.fn(),
    message: vi.fn(),
  });
  return { toast };
});

const firstCategory = BANQUET_CHECKLIST_CATEGORIES[0];
if (!firstCategory) throw new Error("Banquet checklist catalogue is empty");

function menuTable() {
  const heading = screen.getByRole("heading", { name: "Menu Selection" });
  const card = heading.closest("section");
  if (!card) throw new Error("Menu selection card not found");
  return card;
}

function addItem() {
  fireEvent.click(within(menuTable()).getByRole("button", { name: "+ Add item" }));
}

function pickedCategories() {
  return within(menuTable())
    .getAllByLabelText(/Row \d+ category/)
    .map((select) => (select as HTMLSelectElement).value);
}

function packageRowSlugs(itemsPerCategory: number) {
  return packagedCategories().flatMap((category) =>
    Array.from({ length: packageRowCount(category, itemsPerCategory) }, () => category.slug),
  );
}

describe("Banquet public handover checklist", () => {
  it("renders the standalone checklist without asking for a login", () => {
    render(<BanquetChecklist />);
    expect(
      screen.getByRole("heading", { name: /Final Handover Checklist/i }),
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Print checklist" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Reset" })).toBeInTheDocument();
    expect(screen.queryByLabelText(/password/i)).not.toBeInTheDocument();

    expect(screen.getByLabelText("Client Name")).toBeInTheDocument();
    expect(screen.getByLabelText("Mobile No.")).toBeInTheDocument();
    expect(screen.queryByLabelText("Client No.")).not.toBeInTheDocument();
    expect(screen.getByLabelText("Event Date")).toBeInTheDocument();
    expect(screen.getByLabelText("Event Time")).toBeInTheDocument();
    expect(screen.getByLabelText("No. of Guests")).toBeInTheDocument();

    const timeSelect = screen.getByLabelText("Event Time");
    for (const slot of BANQUET_EVENT_TIMES) {
      expect(within(timeSelect).getByRole("option", { name: slot.name })).toBeInTheDocument();
    }
    fireEvent.change(timeSelect, { target: { value: "evening" } });
    expect(timeSelect).toHaveValue("evening");

    const menuSelect = screen.getByLabelText("Menu");
    for (const option of BANQUET_MENU_PACKAGES) {
      expect(within(menuSelect).getByRole("option", { name: option.name })).toBeInTheDocument();
    }
    expect(screen.queryByLabelText("Row 1 quantity")).not.toBeInTheDocument();
    expect(screen.queryByLabelText("Row 1 ready")).not.toBeInTheDocument();
    expect(screen.queryByText(/Maximum \d+ items per category/i)).not.toBeInTheDocument();

    const categorySelect = screen.getByLabelText("Row 1 category");
    for (const category of BANQUET_CHECKLIST_CATEGORIES) {
      expect(within(categorySelect).getByRole("option", { name: category.name })).toBeInTheDocument();
    }
    expect(screen.getByRole("heading", { name: "Menu Selection" })).toBeInTheDocument();
    expect(screen.getByLabelText("Row 1 item")).toBeDisabled();
    expect(
      screen.getAllByRole("heading", { level: 2 }).map((heading) => heading.textContent),
    ).toEqual(["Menu Selection", "Decoration", "Payment", "Staff", "Instruction"]);
    expect(screen.getByRole("heading", { name: "Staff" })).toBeInTheDocument();
    expect(screen.getAllByLabelText(/Staff row \d+ role/)).toHaveLength(BANQUET_STAFF_ROLES.length);
    BANQUET_STAFF_ROLES.forEach((role, index) => {
      expect(screen.getByLabelText(`Staff row ${index + 1} role`)).toHaveValue(role.slug);
      expect(screen.getByLabelText(`${role.name} quantity`)).toBeInTheDocument();
      expect(screen.getByLabelText(`${role.name} names`)).toBeInTheDocument();
    });
    expect(screen.getByLabelText("Payment row 1 particular")).toBeInTheDocument();
    BANQUET_PAYMENT_PARTICULARS.forEach((option) => {
      expect(
        within(screen.getByLabelText("Payment row 1 particular")).getByRole("option", {
          name: option.name,
        }),
      ).toBeInTheDocument();
    });
    BANQUET_PAYMENT_MODES.forEach((option) => {
      expect(
        within(screen.getByLabelText("Payment row 1 mode")).getByRole("option", {
          name: option.name,
        }),
      ).toBeInTheDocument();
    });
  });

  it("treats starters, main course, and sweets as single package categories", () => {
    const bySlug = Object.fromEntries(
      BANQUET_CHECKLIST_CATEGORIES.map((category) => [category.slug, category]),
    );
    expect(bySlug["starter"]?.name).toBe("Starter");
    expect(checklistItemGroups(bySlug["starter"]!).map((group) => group.name)).toEqual([
      "Veg Starter",
      "Paneer Starter",
    ]);
    expect(bySlug["main-course"]?.name).toBe("Main Course");
    expect(checklistItemGroups(bySlug["main-course"]!).map((group) => group.name)).toEqual([
      "Veg Main Course",
      "Paneer Main Course",
      "Kathiawadi Items",
      "Rajasthani Mogar",
    ]);
    expect(bySlug["sweets"]?.name).toBe("Sweets / Ice Cream");
    expect(checklistItemGroups(bySlug["sweets"]!).map((group) => group.name)).toEqual([
      "Sweets",
      "Special Ice Cream (+₹25 Extra Charge)",
      "Ice Cream",
    ]);
    expect(packagedCategories().map((category) => category.slug)).toEqual([
      "welcome-drink",
      "starter",
      "main-course",
      "indian-breads",
      "rice",
      "dal",
      "farsan",
      "sweets",
    ]);
    expect(packageRowCount(BANQUET_CHECKLIST_CATEGORIES.find((c) => c.slug === "rice")!, 3)).toBe(1);
    expect(packageRowCount(BANQUET_CHECKLIST_CATEGORIES.find((c) => c.slug === "dal")!, 3)).toBe(1);
    expect(packageRowCount(BANQUET_CHECKLIST_CATEGORIES.find((c) => c.slug === "sweets")!, 3)).toBe(
      1,
    );
  });

  it("lists every subcategory item directly once a category is picked", () => {
    render(<BanquetChecklist />);
    const welcomeDrink = BANQUET_CHECKLIST_CATEGORIES.find(
      (category) => category.slug === "welcome-drink",
    );
    if (!welcomeDrink) throw new Error("Welcome Drink category missing");

    fireEvent.change(screen.getByLabelText("Row 1 category"), {
      target: { value: welcomeDrink.slug },
    });

    const itemSelect = screen.getByLabelText("Row 1 item");
    expect(itemSelect).not.toBeDisabled();
    for (const group of checklistItemGroups(welcomeDrink)) {
      for (const item of group.items) {
        expect(within(itemSelect).getByRole("option", { name: item })).toBeInTheDocument();
      }
    }
    expect(screen.queryByLabelText("Row 1 subcategory")).not.toBeInTheDocument();

    fireEvent.change(itemSelect, { target: { value: "Special Thandai (स्पेशल ठंडाई)" } });
    expect(itemSelect).toHaveValue("Special Thandai (स्पेशल ठंडाई)");
  });

  it("pre-fills one row per package category for Bronze and two for Silver", () => {
    render(<BanquetChecklist />);

    fireEvent.change(screen.getByLabelText("Menu"), { target: { value: "bronze" } });
    expect(pickedCategories()).toEqual(packageRowSlugs(1));

    fireEvent.change(screen.getByLabelText("Menu"), { target: { value: "silver" } });
    expect(pickedCategories()).toEqual(packageRowSlugs(2));
    expect(pickedCategories().filter((slug) => slug === "rice")).toEqual(["rice"]);
    expect(pickedCategories().filter((slug) => slug === "dal")).toEqual(["dal"]);
    expect(pickedCategories().filter((slug) => slug === "sweets")).toEqual(["sweets"]);
  });

  it("keeps filled items when the menu package changes and only adds missing rows", () => {
    render(<BanquetChecklist />);
    const firstPackaged = packagedCategories()[0]?.slug;
    if (!firstPackaged) throw new Error("No packaged categories");

    fireEvent.change(screen.getByLabelText("Menu"), { target: { value: "bronze" } });
    fireEvent.change(screen.getByLabelText("Row 1 item"), { target: { value: "Special Thandai (स्पेशल ठंडाई)" } });
    fireEvent.change(screen.getByLabelText("Row 1 things required"), {
      target: { value: "Copper dispensers" },
    });

    fireEvent.change(screen.getByLabelText("Menu"), { target: { value: "silver" } });
    expect(pickedCategories()).toEqual(packageRowSlugs(2));
    expect(screen.getByLabelText("Row 1 item")).toHaveValue("Special Thandai (स्पेशल ठंडाई)");
    expect(screen.getByLabelText("Row 1 things required")).toHaveValue("Copper dispensers");
    expect(screen.getByLabelText("Row 2 item")).toHaveValue("");

    fireEvent.change(screen.getByLabelText("Menu"), { target: { value: "bronze" } });
    expect(screen.getByLabelText("Row 1 item")).toHaveValue("Special Thandai (स्पेशल ठंडाई)");
    expect(pickedCategories().filter((slug) => slug === firstPackaged)).toHaveLength(2);
  });

  it("leaves salads, raita, and live counters out of the package rows", () => {
    render(<BanquetChecklist />);
    fireEvent.change(screen.getByLabelText("Menu"), { target: { value: "gold" } });

    for (const slug of [
      "salads",
      "raita",
      "breakfast",
      "chaat-counter",
      "pizza",
      "additional-counters",
    ]) {
      expect(pickedCategories()).not.toContain(slug);
    }
  });

  it("starts Custom from a single empty row and keeps rows already filled", () => {
    render(<BanquetChecklist />);
    fireEvent.change(screen.getByLabelText("Menu"), { target: { value: "custom" } });
    expect(pickedCategories()).toEqual([""]);

    fireEvent.change(screen.getByLabelText("Menu"), { target: { value: "bronze" } });
    fireEvent.change(screen.getByLabelText("Row 1 item"), { target: { value: "Special Thandai (स्पेशल ठंडाई)" } });
    fireEvent.change(screen.getByLabelText("Menu"), { target: { value: "custom" } });
    expect(screen.getByLabelText("Row 1 item")).toHaveValue("Special Thandai (स्पेशल ठंडाई)");
    expect(pickedCategories().length).toBeGreaterThan(1);
  });

  it("allows more than three items in the same category", () => {
    render(<BanquetChecklist />);
    for (let row = 1; row <= 4; row += 1) {
      if (row > 1) addItem();
      const categorySelect = screen.getByLabelText(`Row ${row} category`);
      fireEvent.change(categorySelect, { target: { value: firstCategory.slug } });
      expect(
        within(categorySelect).getByRole("option", { name: firstCategory.name }),
      ).not.toBeDisabled();
    }
  });

  it("removes an extra item row", () => {
    render(<BanquetChecklist />);
    const itemRows = () => within(menuTable()).getAllByLabelText(/Row \d+ category/);

    addItem();
    expect(itemRows()).toHaveLength(2);

    fireEvent.click(within(menuTable()).getAllByRole("button", { name: "Remove item" })[0]!);
    expect(itemRows()).toHaveLength(1);
    expect(
      within(menuTable()).queryByRole("button", { name: "Remove item" }),
    ).not.toBeInTheDocument();
  });

  it("records staff quantity and assigned names", () => {
    render(<BanquetChecklist />);
    fireEvent.change(screen.getByLabelText("Waiters quantity"), { target: { value: "8" } });
    fireEvent.change(screen.getByLabelText("Waiters names"), {
      target: { value: "Ravi, Sameer" },
    });
    fireEvent.change(screen.getByLabelText("Bai / Housekeeping staff quantity"), {
      target: { value: "4" },
    });
    fireEvent.change(screen.getByLabelText("Bai / Housekeeping staff names"), {
      target: { value: "Meena" },
    });
    fireEvent.change(screen.getByLabelText("Ghati workers quantity"), { target: { value: "2" } });
    fireEvent.change(screen.getByLabelText("Ghati workers names"), {
      target: { value: "Kiran" },
    });

    expect(screen.getByLabelText("Waiters quantity")).toHaveValue(8);
    expect(screen.getByLabelText("Waiters names")).toHaveValue("Ravi, Sameer");
    expect(screen.getByLabelText("Bai / Housekeeping staff quantity")).toHaveValue(4);
    expect(screen.getByLabelText("Bai / Housekeeping staff names")).toHaveValue("Meena");
    expect(screen.getByLabelText("Ghati workers quantity")).toHaveValue(2);
    expect(screen.getByLabelText("Ghati workers names")).toHaveValue("Kiran");
  });

  it("records payment rows and instruction notes", () => {
    render(<BanquetChecklist />);
    fireEvent.change(screen.getByLabelText("Payment row 1 particular"), {
      target: { value: "advance" },
    });
    fireEvent.change(screen.getByLabelText("Payment row 1 amount"), {
      target: { value: "50000" },
    });
    fireEvent.change(screen.getByLabelText("Payment row 1 mode"), { target: { value: "upi" } });
    fireEvent.change(screen.getByLabelText("Payment row 1 remarks"), {
      target: { value: "Received at booking" },
    });
    fireEvent.click(screen.getByRole("button", { name: "+ Add payment" }));
    fireEvent.change(screen.getByLabelText("Payment row 2 particular"), {
      target: { value: "balance" },
    });
    fireEvent.change(screen.getByLabelText("Payment row 2 amount"), {
      target: { value: "25000" },
    });

    expect(screen.getByLabelText("Payment row 1 particular")).toHaveValue("advance");
    expect(screen.getByLabelText("Payment row 1 amount")).toHaveValue(50000);
    expect(screen.getByLabelText("Payment row 1 mode")).toHaveValue("upi");
    expect(screen.getByLabelText("Payment row 1 remarks")).toHaveValue("Received at booking");
    expect(screen.getByLabelText("Payment row 2 particular")).toHaveValue("balance");
    expect(screen.getByLabelText("Payment row 2 amount")).toHaveValue(25000);

    fireEvent.click(screen.getAllByRole("button", { name: "Remove payment" })[0]!);
    expect(screen.queryByLabelText("Payment row 2 particular")).not.toBeInTheDocument();
    expect(screen.getByLabelText("Payment row 1 particular")).toHaveValue("balance");

    fireEvent.change(screen.getByRole("textbox", { name: "Instruction" }), {
      target: { value: "Jain thali for 12 guests" },
    });
    expect(screen.getByRole("textbox", { name: "Instruction" })).toHaveValue(
      "Jain thali for 12 guests",
    );
  });
});
