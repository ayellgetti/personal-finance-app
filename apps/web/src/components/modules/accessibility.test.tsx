/** @vitest-environment jsdom */
import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { Badge } from "./shared";

describe("Badge", () => {
  it("adds a non-colour cue to status tones and none to neutral ones", () => {
    const { container, rerender } = render(<Badge tone="danger">Coverage Gap</Badge>);
    expect(screen.getByText("Coverage Gap")).toBeInTheDocument();
    expect(container.querySelector("svg")).not.toBeNull();
    rerender(<Badge tone="success">Healthy</Badge>);
    expect(container.querySelector("svg")).not.toBeNull();
    rerender(<Badge tone="muted">Salary</Badge>);
    expect(container.querySelector("svg")).toBeNull();
  });

  it("hides the icon from assistive tech so the text is read once", () => {
    const { container } = render(<Badge tone="gold">Improve</Badge>);
    expect(container.querySelector("svg")?.getAttribute("aria-hidden")).toBe("true");
  });
});
