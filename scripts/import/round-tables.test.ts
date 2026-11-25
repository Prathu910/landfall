import { describe, expect, it } from "vitest";
import { parseTieBreak, type TieBreakMisprint } from "./round-tables";

function read(text: string): {
  value: string | null;
  misprints: TieBreakMisprint[];
} {
  const misprints: TieBreakMisprint[] = [];
  const value = parseTieBreak(text, "2026-10-15", "Actuary", misprints);
  return { value, misprints };
}

describe("parseTieBreak", () => {
  it("stores a real day-first date, with or without leading zeros", () => {
    expect(read("03/09/2026")).toEqual({ value: "2026-09-03", misprints: [] });
    expect(read("3/9/2026")).toEqual({ value: "2026-09-03", misprints: [] });
    expect(read("29/02/2028")).toEqual({ value: "2028-02-29", misprints: [] });
  });

  it("stores no date, silently, for N/A, a blank or a month and year", () => {
    for (const text of ["N/A", "N/A*", "", "11/2025", "15/2024"]) {
      expect(read(text), text).toEqual({ value: null, misprints: [] });
    }
  });

  it("stores no date for a misprint, and reports it", () => {
    for (const text of ["13/10/206", "31/02/2026", "29/02/2026", "1/13/2026"]) {
      expect(read(text), text).toEqual({
        value: null,
        misprints: [{ date: "2026-10-15", where: "Actuary", text }],
      });
    }
  });

  it("stops the import on any other text", () => {
    for (const text of ["early September", "2026-09-03", "03/09/20266"]) {
      expect(() => read(text), text).toThrow(/Unexpected tie-break date/);
    }
  });
});
