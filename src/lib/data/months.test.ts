import { describe, expect, it } from "vitest";
import { calendarMonths, cohortWindowStart } from "./months";

describe("calendarMonths", () => {
  it("lists the calendar months ending at asAt, oldest first, across a year", () => {
    expect(calendarMonths("2026-02", 4)).toEqual([
      "2025-11",
      "2025-12",
      "2026-01",
      "2026-02",
    ]);
  });

  it("returns no months for a zero or negative count", () => {
    expect(calendarMonths("2026-10", 0)).toEqual([]);
    expect(calendarMonths("2026-10", -3)).toEqual([]);
  });
});

describe("cohortWindowStart", () => {
  it("is the oldest of the 36 stored cohort months", () => {
    expect(cohortWindowStart("2026-10")).toBe("2023-11");
    expect(cohortWindowStart("2026-12")).toBe("2024-01");
    expect(cohortWindowStart("2026-01")).toBe("2023-02");
  });
});
