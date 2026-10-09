import { afterEach, describe, expect, it, vi } from "vitest";
import { fetchPlannerReport } from "./remote";

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("finance remote", () => {
  it("unwraps the planner report from the API envelope", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () =>
        new Response(
          JSON.stringify({
            status: true,
            data: {
              report: {
                generatedAt: "2026-01-01T00:00:00.000Z",
                cashflow: { surplus: 25000 },
              },
            },
            message: "Success",
          }),
          { status: 200, headers: { "Content-Type": "application/json" } },
        ),
      ),
    );

    const report = await fetchPlannerReport();
    expect(report.cashflow.surplus).toBe(25000);
  });
});
