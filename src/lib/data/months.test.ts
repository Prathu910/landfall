import { describe, expect, it } from "vitest";
import { calendarMonths } from "./months";

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
