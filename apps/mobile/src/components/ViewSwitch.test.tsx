/** @vitest-environment jsdom */
import { describe, expect, it, vi } from "vitest";
import { fireEvent, screen } from "@testing-library/react";
import { AddButton, ViewSwitch } from "@/components/ViewSwitch";
import { renderMobile } from "@/test/render-mobile";

describe("view switch", () => {
  it("switches layout with an icon button named for the view", () => {
    const onChange = vi.fn();
    renderMobile(
      <ViewSwitch
        label="Enquiry view"
        value="list"
        onChange={onChange}
        options={[
          { value: "list", label: "List" },
          { value: "cards", label: "Cards" },
          { value: "board", label: "Board" },
        ]}
      />,
    );

    expect(screen.getByRole("button", { name: "List" })).toHaveAttribute("aria-pressed", "true");
    fireEvent.click(screen.getByRole("button", { name: "Board" }));
    expect(onChange).toHaveBeenCalledWith("board");
  });

  it("creates from a round plus button", () => {
    const onClick = vi.fn();
    renderMobile(<AddButton label="New" onClick={onClick} />);
    fireEvent.click(screen.getByRole("button", { name: "New" }));
    expect(onClick).toHaveBeenCalledTimes(1);
  });
});
