import { render } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { usePageMeta } from "./usePageMeta";

function Probe({ title, description }: { title: string; description: string }) {
  usePageMeta(title, description);
  return null;
}

const getMeta = () => document.querySelector('meta[name="description"]');

describe("usePageMeta", () => {
  afterEach(() => {
    getMeta()?.remove();
    document.title = "";
  });

  it("sets the document title and meta description while mounted", () => {
    render(<Probe title="Why | Freedom Planner" description="desc" />);

    expect(document.title).toBe("Why | Freedom Planner");
    expect(getMeta()).toHaveAttribute("content", "desc");
  });

  it("restores the previous title and description on unmount", () => {
    document.title = "Before";
    const meta = document.createElement("meta");
    meta.setAttribute("name", "description");
    meta.setAttribute("content", "old");
    document.head.appendChild(meta);

    const { unmount } = render(<Probe title="Why | Freedom Planner" description="desc" />);
    unmount();

    expect(document.title).toBe("Before");
    expect(getMeta()).toHaveAttribute("content", "old");
  });

  it("creates the meta tag when missing and removes it on unmount", () => {
    expect(getMeta()).toBeNull();

    const { unmount } = render(<Probe title="T" description="made" />);
    expect(getMeta()).toHaveAttribute("content", "made");

    unmount();
    expect(getMeta()).toBeNull();
  });
});
