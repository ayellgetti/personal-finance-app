import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it } from "vitest";
import Course from "./Course";

function renderPage() {
  return render(
    <MemoryRouter>
      <Course />
    </MemoryRouter>,
  );
}

describe("Course", () => {
  it("renders one h1, the five-step loop and three level sections", () => {
    const { container } = renderPage();
    expect(screen.getAllByRole("heading", { level: 1 })).toHaveLength(1);
    const loop = container.querySelector("#loop");
    expect(loop?.querySelectorAll("ol > li")).toHaveLength(5);
    ["Learn", "Check", "Apply", "Act", "Track"].forEach((step) => {
      expect(loop?.textContent).toContain(step);
    });
    ["foundation", "growth", "freedom"].forEach((id) => {
      expect(container.querySelector(`main section#${id}`)).not.toBeNull();
    });
  });

  it("lists all 30 lessons in order", () => {
    const { container } = renderPage();
    const rows = Array.from(container.querySelectorAll("#levels tbody tr"));
    expect(rows).toHaveLength(30);
    const titles = rows.map((row) => row.querySelector("th")?.textContent ?? "");
    expect(titles[0]).toBe("What does financial freedom mean?");
    expect(titles[29]).toBe("Create your financial-freedom roadmap");
    const numbers = rows.map((row) => row.querySelector("td")?.textContent);
    expect(numbers).toEqual(Array.from({ length: 30 }, (_, i) => String(i + 1)));
  });

  it("groups lessons 1-10, 11-20 and 21-30 under Foundation, Growth and Freedom", () => {
    const { container } = renderPage();
    const expected: Record<string, [string, string]> = {
      foundation: ["1", "10"],
      growth: ["11", "20"],
      freedom: ["21", "30"],
    };
    Object.entries(expected).forEach(([id, [first, last]]) => {
      const rows = Array.from(container.querySelectorAll(`#${id} tbody tr`));
      expect(rows).toHaveLength(10);
      expect(rows[0]?.querySelector("td")?.textContent).toBe(first);
      expect(rows[9]?.querySelector("td")?.textContent).toBe(last);
    });
    expect(container.querySelectorAll("#foundation table")).toHaveLength(4);
    expect(container.querySelectorAll("#growth table")).toHaveLength(3);
    expect(container.querySelectorAll("#freedom table")).toHaveLength(3);
  });

  it("every table-of-contents link targets an existing id", () => {
    const { container } = renderPage();
    const links = screen.getByRole("navigation", { name: /on this page/i }).querySelectorAll("a");
    expect(links).toHaveLength(3);
    links.forEach((link) => {
      const id = link.getAttribute("href")?.slice(1) ?? "";
      expect(container.querySelector(`#${id}`)).not.toBeNull();
    });
  });

  it("Start Level 1 points at the app; next link goes home", () => {
    renderPage();
    expect(screen.getByRole("link", { name: /start level 1/i })).toHaveAttribute(
      "href",
      expect.stringContaining("/login"),
    );
    expect(screen.getByRole("link", { name: /back to the home page/i })).toHaveAttribute("href", "/");
  });

  it("shows the example lesson", () => {
    const { container } = renderPage();
    expect(container.querySelector("#example")?.textContent).toContain("What is an emergency fund?");
  });

  it("contains no internal planning language", () => {
    const { container } = renderPage();
    const text = container.querySelector("main")?.textContent ?? "";
    expect(text).not.toMatch(
      /planned education module|we will build|do not isolate|do not ask the user|from the spec|internal|outline|planned|not live|will contain|static reads|next lesson|pulls your|reuse the numbers|watch the gap close|from your household/i,
    );
  });

  it("spot-checks the tool and action cells for the first and last lessons", () => {
    const { container } = renderPage();
    const rows = Array.from(container.querySelectorAll("#levels tbody tr"));
    const cells = (i: number) => Array.from(rows[i]?.querySelectorAll("td") ?? []).map((c) => c.textContent);
    expect(cells(0)).toEqual(expect.arrayContaining(["Financial Freedom Score", "Define a freedom goal"]));
    expect(cells(29)).toEqual(
      expect.arrayContaining(["Advisor + goals + forecast", "Leave with priorities, actions, and a projection"]),
    );
  });

  it("uses unique ids inside main", () => {
    const { container } = renderPage();
    const ids = Array.from(container.querySelectorAll("main [id]")).map((el) => el.id);
    expect(new Set(ids).size).toBe(ids.length);
  });
});
