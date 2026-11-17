import type { MonthKey } from "./types";

function monthIndex(month: MonthKey): number {
  return Number(month.slice(0, 4)) * 12 + Number(month.slice(5, 7)) - 1;
}

function monthAt(index: number): MonthKey {
  const month = String((index % 12) + 1).padStart(2, "0");
  return `${Math.floor(index / 12)}-${month}`;
}

/**
 * The `count` calendar months ending at `asAt`, oldest first. Windows are
 * built from the calendar, never from the keys a record happens to hold: a
 * record has no key for a month that was not fetched.
 */
export function calendarMonths(asAt: MonthKey, count: number): MonthKey[] {
  const end = monthIndex(asAt);
  return Array.from({ length: Math.max(0, count) }, (_, i) =>
    monthAt(end - count + 1 + i),
  );
}

/**
 * Splits a calendar window into months the record covers (a key exists, even
 * `{}`) and months that were not fetched: "not published", never zero.
 */
export function splitCoverage(
  window: MonthKey[],
  byMonth: Record<MonthKey, unknown> | undefined,
): { covered: MonthKey[]; notPublished: MonthKey[] } {
  const covered = window.filter((month) => byMonth?.[month] !== undefined);
  const notPublished = window.filter((month) => byMonth?.[month] === undefined);
  return { covered, notPublished };
}
