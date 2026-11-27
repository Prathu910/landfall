import { describe, expect, it } from "vitest";
import { A, B, C, FIXTURE_CORES, OLD } from "./__fixtures__/cores";
import { currentCores, stateMonthFigure, stateSeries } from "./series";

describe("stateSeries", () => {
  const series = stateSeries(FIXTURE_CORES, "190", "NSW", "2026-10", 3);

  it("sums each month's cells as intervals, never adding ANY", () => {
    const oct = series.months[2].figure;
    // 40 + 21 + 30 published; one hidden "<20" from A and one from C.
    expect(oct).toEqual({ total: { min: 91, max: 129 }, maskedCells: 2 });
  });

  it("reads a fetched month without rows as zero, not as unpublished", () => {
    expect(stateMonthFigure([B], "190", "NSW", "2026-09")).toEqual({
      total: { min: 0, max: 0 },
      maskedCells: 0,
    });
  });

  it("marks a month no core fetched as not published, never zero", () => {
    expect(stateMonthFigure([C], "190", "NSW", "2026-08")).toBeNull();
    const early = stateSeries(FIXTURE_CORES, "190", "NSW", "2026-10", 4);
    expect(early.months[0]).toEqual({ month: "2026-07", figure: null });
  });

  it("scales to the largest ceiling and finds the program year's July", () => {
    expect(series.tallest).toBe(129);
    expect(series.programYearStart).toBeNull();
    const year = stateSeries(FIXTURE_CORES, "190", "NSW", "2026-10", 5);
    expect(year.programYearStart).toBe(1);
  });

  it("keeps only current cores still in the data", () => {
    const index = [
      { code: A.code, name: "A", hasData: true },
      { code: B.code, name: "B", hasData: false },
      { code: C.code, name: "C", hasData: true, lastAsAt: "2026-09" },
      { code: OLD.code, name: "Old", hasData: true },
    ];
    const byCode = new Map([A, B, C, OLD].map((c) => [c.code, c]));
    const cores = currentCores(
      index,
      (code) => byCode.get(code) ?? null,
      "2026-10",
    );
    expect(cores.map((c) => c.code)).toEqual([A.code, B.code]);
  });
});
