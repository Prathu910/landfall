import { describe, expect, it } from "vitest";
import {
  aboutText,
  countText,
  formatLongMonth,
  minimumText,
  mrzLine,
  rangeText,
  stateFigureText,
} from "./format";
import type { StateFigure } from "./types";

const fig = (floor: number, maskedCells: number): StateFigure => ({
  total: { min: floor, max: floor },
  floor,
  maskedCells,
  previousFloor: null,
  top: [],
});

describe("format", () => {
  it("says about only for narrow ranges", () => {
    expect(aboutText({ min: 166555, max: 167904 })).toBe("about 167,000");
    expect(aboutText({ min: 790, max: 6927 })).toBeNull();
    expect(aboutText({ min: 500, max: 500 })).toBeNull();
  });
  it("formats ranges and minimums", () => {
    expect(rangeText({ min: 181076, max: 182254 })).toBe("181,076–182,254");
    expect(rangeText({ min: 5, max: 5 })).toBe("5");
    expect(minimumText({ min: 0, max: 285 })).toBe("under 286");
    expect(minimumText({ min: 14876, max: 16643 })).toBe("at least 14,876");
  });
  it("never shows an all-masked state as 0", () => {
    expect(stateFigureText(fig(0, 138))).toBe("under 20 for each occupation");
    expect(stateFigureText(fig(1018, 4))).toBe("at least 1,018");
  });
  it("formats counts and months", () => {
    expect(countText("<20")).toBe("under 20");
    expect(countText("1234")).toBe("1,234");
    expect(formatLongMonth("2026-10")).toBe("October 2026");
    const mrz = mrzLine("2026-10");
    expect(mrz).toMatch(/^P<AUSSKILLSELECT<<UPDATE<OCTOBER<2026<+$/);
    expect(mrz).toHaveLength(44);
  });
});
