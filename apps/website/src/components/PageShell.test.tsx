import { describe, expect, it, vi, afterEach } from "vitest";
import { fireEvent, render, screen, within } from "@testing-library/react";
import { Link, MemoryRouter } from "react-router-dom";
import { PageShell } from "@/components/PageShell";
import { appUrl } from "@/lib/utils";

function renderAt(path: string, extra?: React.ReactNode) {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <PageShell>{extra ?? <p>content</p>}</PageShell>
    </MemoryRouter>,
  );
}

afterEach(() => vi.restoreAllMocks());

describe("PageShell", () => {
  it("marks the current page link with aria-current", () => {
    renderAt("/guide");
    const nav = within(screen.getByRole("navigation", { name: "Main" }));
    expect(nav.getByRole("link", { name: "Guide" })).toHaveAttribute("aria-current", "page");
    expect(nav.getByRole("link", { name: "Why" })).not.toHaveAttribute("aria-current");
  });

  it("links to the three new pages", () => {
    renderAt("/guide");
    const nav = within(screen.getByRole("navigation", { name: "Main" }));
    expect(nav.getByRole("link", { name: "Why" })).toHaveAttribute("href", "/why");
    expect(nav.getByRole("link", { name: "Guide" })).toHaveAttribute("href", "/guide");
    expect(nav.getByRole("link", { name: "Course" })).toHaveAttribute("href", "/course");
  });

  it("menu button reveals the nav links on small screens", () => {
    renderAt("/guide");
    fireEvent.click(screen.getByRole("button", { name: "Open menu" }));
    const close = screen.getByRole("button", { name: "Close menu" });
    expect(close).toHaveAttribute("aria-expanded", "true");
    const mobile = screen.getByRole("navigation", { name: "Mobile" });
    expect(mobile).toBeInTheDocument();
    expect(mobile).toHaveAttribute("id", "mobile-nav");
    expect(document.getElementById("mobile-nav")).not.toBeNull();
    fireEvent.click(within(mobile).getByRole("link", { name: "Why" }));
    expect(screen.getByRole("button", { name: "Open menu" })).toBeInTheDocument();
    expect(document.getElementById("mobile-nav")).toBeNull();
  });

  it("footer no longer links the guide into the app", () => {
    renderAt("/why");
    const appGuide = appUrl("/guide");
    const hrefs = screen.getAllByRole("link").map((a) => a.getAttribute("href"));
    expect(hrefs).not.toContain(appGuide);
  });

  it("scrolls to top when the route changes, but not with a hash", () => {
    const spy = vi.spyOn(window, "scrollTo").mockImplementation(() => {});
    renderAt("/why", <Link to="/guide">go guide</Link>);
    spy.mockClear();
    fireEvent.click(screen.getByText("go guide"));
    expect(spy).toHaveBeenCalledWith(0, 0);
  });

  it("does not scroll on first render", () => {
    const spy = vi.spyOn(window, "scrollTo").mockImplementation(() => {});
    renderAt("/why");
    expect(spy).not.toHaveBeenCalled();
  });

  it("does not scroll when the URL has a hash", () => {
    const spy = vi.spyOn(window, "scrollTo").mockImplementation(() => {});
    renderAt("/why", <Link to="/guide#x">go hash</Link>);
    spy.mockClear();
    fireEvent.click(screen.getByText("go hash"));
    expect(spy).not.toHaveBeenCalled();
  });
});
