/** @vitest-environment jsdom */
import { describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import { LearningHubModule } from "./LearningHubModule";
import { LEARN_CATEGORIES } from "@/lib/finance/learnContent";

vi.mock("@/lib/finance/store", () => ({
  useFinance: () => ({ data: {} }),
}));

vi.mock("@/lib/finance/calculations", () => ({
  coachInsights: () => [],
}));

const allLessonTitles = LEARN_CATEGORIES.flatMap((c) => c.lessons.map((l) => l.title));

describe("LearningHubModule", () => {
  it("defaults to All and lists every lesson", () => {
    render(<LearningHubModule />);

    expect(screen.getByRole("button", { name: "All" })).toBeTruthy();
    for (const title of allLessonTitles) {
      expect(screen.getByText(title)).toBeTruthy();
    }
  });

  it("filters to a single category when that capsule is selected", () => {
    render(<LearningHubModule />);

    fireEvent.click(screen.getByRole("button", { name: "Debt Management" }));

    const debt = LEARN_CATEGORIES.find((c) => c.id === "debt");
    expect(debt).toBeTruthy();
    expect(screen.getByText(debt!.lessons[0]!.title)).toBeTruthy();
    expect(screen.queryByText("The 50-30-20 Budget")).toBeNull();
  });

  it("returns to the full library from All", () => {
    render(<LearningHubModule />);

    fireEvent.click(screen.getByRole("button", { name: "Debt Management" }));
    fireEvent.click(screen.getByRole("button", { name: "All" }));

    expect(screen.getByText("The 50-30-20 Budget")).toBeTruthy();
    expect(screen.getByText("Avalanche vs Snowball")).toBeTruthy();
  });
});
