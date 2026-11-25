import { formatLongMonth, formatMonth } from "../report/copy";
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

/**
 * A state figure is a floor, never a total; an all-masked state is not 0,
 * and a state with no published cell at all is not "at least 0".
 */
export function stateFigureText(f: StateFigure): string {
  if (f.floor > 0) return `at least ${formatNumber(f.floor)}`;
  return f.maskedCells > 0 ? "under 20 for each occupation" : "none published";
}

/** The "+ N hidden small counts" note beside a state floor; null when none are hidden. */
export function hiddenCountsText(maskedCells: number): string | null {
  if (maskedCells <= 0) return null;
  const noun = maskedCells === 1 ? "count" : "counts";
  return `+ ${formatNumber(maskedCells)} hidden small ${noun}`;
}

/** A summed range; "under N" when nothing above the hidden counts was published, never "0–N". */
export function intervalText(i: Interval): string {
  if (i.min > 0 || i.max === 0) return rangeText(i);
  return `under ${formatNumber(i.max + 1)}`;
}

/** An exact count as itself; otherwise its lower bound (`minimumText`). */
export function leastText(i: Interval): string {
  return i.min === i.max ? formatNumber(i.min) : minimumText(i);
}

/**
 * "about N" (the midpoint to the nearest 1,000), only when the range is at
 * most 2% of its midpoint wide. Exact figures need no "about".
 */
export function aboutText(i: Interval): string | null {
  const width = i.max - i.min;
  const mid = (i.min + i.max) / 2;
  if (width === 0 || mid === 0 || width > 0.02 * mid) return null;
  const rounded = Math.round(mid / 1000) * 1000;
  return rounded === 0 ? null : `about ${formatNumber(rounded)}`;
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

/** "5 Oct 2026" from a YYYY-MM-DD date. */
export function dayText(date: string): string {
  return `${Number(date.slice(8, 10))} ${formatMonth(date.slice(0, 7))}`;
}

/** "15 October 2026" from a YYYY-MM-DD date. */
export function longDayText(date: string): string {
  return `${Number(date.slice(8, 10))} ${formatLongMonth(date.slice(0, 7))}`;
}

/** The month's last calendar day, YYYY-MM-DD: the SkillSelect as-at date. */
export function monthEnd(month: MonthKey): string {
  const [year, m] = month.split("-").map(Number);
  const last = new Date(Date.UTC(year, m, 0)).getUTCDate();
  return `${month}-${String(last).padStart(2, "0")}`;
}
