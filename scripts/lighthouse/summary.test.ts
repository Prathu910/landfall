import { describe, expect, it } from "vitest";
import { formatTable, median, summariseCell, type Cell } from "./summary";

describe("median", () => {
  it("returns the middle of an odd count and the lower middle of an even one", () => {
    expect(median([100, 92, 97])).toBe(97);
    expect(median([4, 1, 3, 2])).toBe(2);
    expect(median([])).toBeUndefined();
  });
});

describe("summariseCell", () => {
  const cell: Cell = {
    page: "/",
    formFactor: "mobile",
    scheme: "light",
    gated: ["performance", "accessibility"],
    runs: [
      { scores: { performance: 98, accessibility: 100, seo: 92 }, lcpMs: 2100 },
      {
        scores: { performance: 100, accessibility: 100, seo: 92 },
        lcpMs: 1800,
      },
      { scores: { performance: 99, accessibility: 100, seo: 92 }, lcpMs: 1900 },
    ],
  };

  it("medians each score separately and fails only gated categories under 100", () => {
    const summary = summariseCell(cell);
    expect(summary.scores).toEqual({
      performance: 99,
      accessibility: 100,
      seo: 92,
    });
    expect(summary.lcpMs).toBe(1900);
    expect(summary.failures).toEqual(["performance"]);
  });

  it("fails a gated category that never produced a score", () => {
    const summary = summariseCell({ ...cell, gated: ["best-practices"] });
    expect(summary.failures).toEqual(["best-practices"]);
  });

  it("marks failing scores in the table", () => {
    const table = formatTable([summariseCell(cell)]);
    expect(table).toContain("99!");
    expect(table).toContain("1.9 s");
    expect(table.split("\n")).toHaveLength(2);
  });
});
