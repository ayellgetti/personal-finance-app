import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it } from "vitest";
import { PageHero } from "./PageHero";
import { TableOfContents } from "./TableOfContents";
import { CtaBand } from "./CtaBand";

describe("shared page components", () => {
  it("PageHero renders one h1 with title, eyebrow, lead and actions", () => {
    render(
      <PageHero eyebrow="Why" title="Plan with clarity" lead="A short lead.">
        <button type="button">Action</button>
      </PageHero>,
    );
    expect(screen.getAllByRole("heading", { level: 1 })).toHaveLength(1);
    expect(screen.getByRole("heading", { level: 1, name: "Plan with clarity" })).toBeInTheDocument();
    expect(screen.getByText("Why")).toBeInTheDocument();
    expect(screen.getByText("A short lead.")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Action" })).toBeInTheDocument();
  });

  it("TableOfContents renders a labelled nav with an anchor per item", () => {
    render(
      <TableOfContents
        items={[
          { id: "a", label: "First" },
          { id: "b", label: "Second" },
        ]}
      />,
    );
    const nav = screen.getByRole("navigation", { name: "On this page" });
    expect(nav).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "First" })).toHaveAttribute("href", "#a");
    expect(screen.getByRole("link", { name: "Second" })).toHaveAttribute("href", "#b");
  });

  it("CtaBand links to the app login and to the next page", () => {
    render(
      <MemoryRouter>
        <CtaBand next={{ to: "/guide", label: "See a real household" }} />
      </MemoryRouter>,
    );
    expect(screen.getByRole("heading", { name: "Ready to try it with your own numbers?" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Create your account" }).getAttribute("href")).toContain("/login");
    expect(screen.getByRole("link", { name: "See a real household" })).toHaveAttribute("href", "/guide");
  });
});
