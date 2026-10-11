/** @vitest-environment jsdom */
import { afterEach, describe, expect, it, vi } from "vitest";
import { fireEvent, screen } from "@testing-library/react";
import { ChoiceSelect } from "@/components/forms/ChoiceSelect";
import { renderMobile } from "@/test/render-mobile";

const options = [
  { value: "a", label: "Priya Shah", detail: "+919888888888", text: "Priya Shah · +919888888888" },
  { value: "b", label: "Priya Shah", detail: "+919111111111", text: "Priya Shah · +919111111111" },
];

describe("choice select", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("keeps name and mobile together in the native picker off Android", () => {
    renderMobile(
      <ChoiceSelect id="person" value="" onChange={() => undefined} emptyLabel="Select contact" options={options} />,
    );

    expect(screen.getByRole("option", { name: "Priya Shah · +919888888888" })).toBeInTheDocument();
  });

  it("shows the name and mobile on separate lines on Android and filters them", () => {
    vi.stubGlobal("navigator", { userAgent: "Mozilla/5.0 (Linux; Android 14; Pixel 8)" });
    const onChange = vi.fn();
    renderMobile(
      <ChoiceSelect id="person" value="" onChange={onChange} emptyLabel="Select contact" options={options} />,
    );

    expect(screen.getAllByText("Priya Shah")).toHaveLength(2);
    expect(screen.getByText("+919888888888")).toBeInTheDocument();
    expect(screen.getByText("+919111111111")).toBeInTheDocument();

    fireEvent.change(screen.getByLabelText("Search by name or mobile"), { target: { value: "9111" } });
    expect(screen.queryByText("+919888888888")).not.toBeInTheDocument();
    fireEvent.click(screen.getByText("+919111111111"));
    expect(onChange).toHaveBeenCalledWith("b");
  });
});
