import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it } from "vitest";
import Guide from "./Guide";

function renderPage() {
  return render(
    <MemoryRouter>
      <Guide />
    </MemoryRouter>,
  );
}

describe("Guide", () => {
  it("renders one h1 and a section for each id", () => {
    const { container } = renderPage();
    expect(screen.getAllByRole("heading", { level: 1 })).toHaveLength(1);
    const ids = Array.from(container.querySelectorAll("main section[id]")).map((el) => el.id);
    expect(ids).toEqual(["start", "arjun", "numbers", "dashboard", "problems", "plan", "enter"]);
  });

  it("shows Arjun's household figures", () => {
    const { container } = renderPage();
    const text = container.querySelector("main")?.textContent ?? "";
    ["₹2,52,500", "₹1,48,967", "₹19.60 L", "41%", "₹49.00 L", "₹63.80 L"].forEach((figure) => {
      expect(text).toContain(figure);
    });
  });

  it("uses captioned tables for income, outgo, loans and investments", () => {
    renderPage();
    expect(screen.getAllByRole("table")).toHaveLength(4);
    expect(screen.getByRole("table", { name: /monthly income/i })).toBeInTheDocument();
    expect(screen.getByRole("table", { name: /monthly outgo/i })).toBeInTheDocument();
    expect(screen.getByRole("table", { name: /loans/i })).toBeInTheDocument();
    expect(screen.getByRole("table", { name: /investments/i })).toBeInTheDocument();
  });

  it("lists four problems and four getting-started steps", () => {
    const { container } = renderPage();
    expect(container.querySelectorAll("#problems ol > li")).toHaveLength(4);
    expect(container.querySelectorAll("#start ol > li")).toHaveLength(4);
  });

  it("every table-of-contents link targets an existing id", () => {
    const { container } = renderPage();
    const links = screen.getByRole("navigation", { name: /on this page/i }).querySelectorAll("a");
    expect(links.length).toBeGreaterThanOrEqual(6);
    links.forEach((link) => {
      const id = link.getAttribute("href")?.slice(1) ?? "";
      expect(container.querySelector(`#${id}`)).not.toBeNull();
    });
  });

  it("sign-up call to action points at the app; next link goes to /course", () => {
    renderPage();
    expect(screen.getByRole("link", { name: /create your account/i })).toHaveAttribute(
      "href",
      expect.stringContaining("/login"),
    );
    expect(screen.getByRole("link", { name: /learn the course/i })).toHaveAttribute("href", "/course");
  });

  it("states the sample is fictional and educational, without internal wording", () => {
    const { container } = renderPage();
    const text = container.querySelector("main")?.textContent ?? "";
    expect(text).toMatch(/fictional/i);
    expect(text).toMatch(/educational/i);
    expect(text).not.toMatch(/openai|json|rule engine|internal brief|HDFC|\bLIC\b/i);
  });
});
