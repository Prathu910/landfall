import { describe, expect, it } from "vitest";
import {
  aboutText,
  countText,
  dayText,
  formatLongMonth,
  hiddenCountsText,
  intervalText,
  leastText,
  longDayText,
  minimumText,
  monthEnd,
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
  it("never says about 0 or at least 0", () => {
    expect(aboutText({ min: 100, max: 101 })).toBeNull();
    expect(stateFigureText(fig(0, 0))).toBe("none published");
  });
  it("counts hidden small counts", () => {
    expect(hiddenCountsText(324)).toBe("+ 324 hidden small counts");
    expect(hiddenCountsText(1)).toBe("+ 1 hidden small count");
    expect(hiddenCountsText(0)).toBeNull();
  });
  it("never prints a range that starts at 0", () => {
    expect(intervalText({ min: 0, max: 19 })).toBe("under 20");
    expect(intervalText({ min: 0, max: 0 })).toBe("0");
    expect(intervalText({ min: 21, max: 1256 })).toBe("21–1,256");
    expect(leastText({ min: 22, max: 22 })).toBe("22");
    expect(leastText({ min: 34, max: 72 })).toBe("at least 34");
  });
  it("formats days and month ends", () => {
    expect(dayText("2026-10-05")).toBe("5 Oct 2026");
    expect(longDayText("2026-10-15")).toBe("15 October 2026");
    expect(monthEnd("2026-10")).toBe("2026-10-31");
    expect(monthEnd("2028-02")).toBe("2028-02-29");
  });
});
