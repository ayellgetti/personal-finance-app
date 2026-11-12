import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it } from "vitest";
import Why from "./Why";

function renderPage() {
  return render(
    <MemoryRouter>
      <Why />
    </MemoryRouter>,
  );
}

describe("Why", () => {
  it("renders one h1 and the five sections in order", () => {
    const { container } = renderPage();
    expect(screen.getAllByRole("heading", { level: 1 })).toHaveLength(1);
    const ids = Array.from(container.querySelectorAll("main section[id]")).map((el) => el.id);
    expect(ids).toEqual(["problem", "objective", "today", "trust", "your-side"]);
  });

  it("every table-of-contents link targets an existing id", () => {
    const { container } = renderPage();
    const links = screen.getByRole("navigation", { name: /on this page/i }).querySelectorAll("a");
    expect(links).toHaveLength(5);
    links.forEach((link) => {
      const id = link.getAttribute("href")?.slice(1) ?? "";
      expect(container.querySelector(`#${id}`)).not.toBeNull();
    });
  });

  it("sign-up call to action points at the app and the next link goes to /guide", () => {
    renderPage();
    expect(screen.getByRole("link", { name: /create your account/i })).toHaveAttribute(
      "href",
      expect.stringContaining("/login"),
    );
    expect(screen.getByRole("link", { name: /see a real household/i })).toHaveAttribute("href", "/guide");
  });

  it("sets the page title", () => {
    renderPage();
    expect(document.title).toContain("Why Freedom Planner exists");
  });

  it("contains no commercial or internal-brief language", () => {
    const { container } = renderPage();
    const text = container.querySelector("main")?.textContent ?? "";
    expect(text.length).toBeGreaterThan(500);
    expect(text).not.toMatch(/commission|referral|trail|distribution|flywheel|moat|internal brief|partner|platform|revenue|monetis/i);
  });

  it("does not overclaim where data lives", () => {
    const { container } = renderPage();
    const text = container.querySelector("main")?.textContent ?? "";
    expect(text).not.toMatch(/stays in your account/i);
    expect(text).toContain("This website does not store your finances.");
  });
});
