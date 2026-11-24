import { formatLongMonth } from "../report/copy";
import type { CountText, Interval, MonthKey } from "../data/types";
import type { StateFigure } from "./types";

export { formatLongMonth };

export function formatNumber(n: number): string {
  return String(n).replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

/** "181,076–182,254", or one number when the interval is exact. */
export function rangeText(i: Interval): string {
  return i.min === i.max
    ? formatNumber(i.min)
    : `${formatNumber(i.min)}–${formatNumber(i.max)}`;
}

/** A lower bound: "at least 14,876", or "under 286" when the floor is zero. */
export function minimumText(i: Interval): string {
  if (i.min > 0) return `at least ${formatNumber(i.min)}`;
  return i.max === 0 ? "0" : `under ${formatNumber(i.max + 1)}`;
}

/** A state figure is a floor, never a total; an all-masked state is not 0. */
export function stateFigureText(f: StateFigure): string {
  return f.floor === 0 && f.maskedCells > 0
    ? "under 20 for each occupation"
    : `at least ${formatNumber(f.floor)}`;
}

/**
 * "about N" (the midpoint to the nearest 1,000), only when the range is at
 * most 2% of its midpoint wide. Exact figures need no "about".
 */
export function aboutText(i: Interval): string | null {
  const width = i.max - i.min;
  const mid = (i.min + i.max) / 2;
  if (width === 0 || mid === 0 || width > 0.02 * mid) return null;
  return `about ${formatNumber(Math.round(mid / 1000) * 1000)}`;
}

export function countText(t: CountText): string {
  return t === "<20" ? "under 20" : formatNumber(Number(t));
}

/** The decorative passport machine-readable line, 44 characters. */
export function mrzLine(month: MonthKey): string {
  const year = month.slice(0, 4);
  const name = formatLongMonth(month).split(" ")[0].toUpperCase();
  return `P<AUSSKILLSELECT<<UPDATE<${name}<${year}`.padEnd(44, "<");
}
