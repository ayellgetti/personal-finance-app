/** @vitest-environment jsdom */
import { useState } from "react";
import { describe, expect, it, vi } from "vitest";
import { fireEvent, screen } from "@testing-library/react";
import { FilterSortBar, type FilterSection } from "@/components/FilterSortSheet";
import type { SortOrder } from "@/lib/mobile/sort";
import { renderMobile } from "@/test/render-mobile";

function Harness({ count = 3 }: { count?: number }) {
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState("newest");
  const [order, setOrder] = useState<SortOrder>("desc");
  const [stage, setStage] = useState("all");
  const sections: FilterSection[] = [
    {
      id: "stage",
      kind: "single",
      label: "Stage",
      value: stage,
      neutral: "all",
      options: [
        { value: "all", label: "All" },
        { value: "open", label: "Open" },
      ],
      onChange: setStage,
    },
  ];
  return (
    <FilterSortBar
      query={query}
      onQuery={setQuery}
      searchPlaceholder="Search enquiries"
      searchLabel="Search enquiries"
      sort={sort}
      onSort={setSort}
      sortOptions={[
        { value: "newest", label: "Newest" },
        { value: "title", label: "Title" },
      ]}
      defaultSort="newest"
      order={order}
      onOrder={setOrder}
      defaultOrder="desc"
      sections={sections}
      resultCount={count}
      singular="enquiry"
      plural="enquiries"
      onClear={() => setStage("all")}
    />
  );
}

describe("filter and sort sheet", () => {
  it("searches, applies a filter chip, and closes on the result count", () => {
    renderMobile(<Harness />);

    fireEvent.change(screen.getByLabelText("Search enquiries"), { target: { value: "wedding" } });
    fireEvent.click(screen.getByRole("button", { name: /Filter and sort, 1 applied/ }));

    expect(screen.getByRole("heading", { name: "Filter & Sort" })).toBeInTheDocument();
    expect(screen.getByText("“wedding”")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /^Stage/ }));
    fireEvent.click(screen.getByRole("radio", { name: "Open" }));
    expect(screen.getByRole("button", { name: "Remove Open" })).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /^Sort/ }));
    fireEvent.click(screen.getByRole("radio", { name: "Title" }));
    expect(screen.getByRole("button", { name: "Remove Title" })).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "See 3 enquiries" }));
    expect(screen.queryByRole("heading", { name: "Filter & Sort" })).not.toBeInTheDocument();
  });

  it("puts the add button on the search row and opens filters from the funnel", () => {
    const onAdd = vi.fn();
    renderMobile(
      <FilterSortBar
        query=""
        onQuery={() => undefined}
        searchPlaceholder="Search tasks"
        searchLabel="Search tasks"
        sort="due"
        onSort={() => undefined}
        sortOptions={[{ value: "due", label: "Due" }]}
        defaultSort="due"
        order="asc"
        onOrder={() => undefined}
        defaultOrder="asc"
        sections={[]}
        resultCount={0}
        singular="task"
        plural="tasks"
        onClear={() => undefined}
        onAdd={onAdd}
        addLabel="New task"
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: "New task" }));
    expect(onAdd).toHaveBeenCalledTimes(1);
    fireEvent.click(screen.getByRole("button", { name: "Filter and sort" }));
    expect(screen.getByRole("heading", { name: "Filter & Sort" })).toBeInTheDocument();
  });

  it("clears applied filters", () => {
    renderMobile(<Harness />);
    fireEvent.change(screen.getByLabelText("Search enquiries"), { target: { value: "wedding" } });
    fireEvent.click(screen.getByRole("button", { name: /Filter and sort/ }));
    fireEvent.click(screen.getByRole("button", { name: "Clear Filters" }));

    expect(screen.getByText("None yet.")).toBeInTheDocument();
    expect(screen.getByLabelText("Search enquiries")).toHaveValue("");
  });
});
