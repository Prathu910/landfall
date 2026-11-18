import type { Interval, MonthKey } from "../data/types";
import { MONTH_NAMES } from "../migration";
import { formatInterval } from "../pool";

/** Wording the report must never use (spec section 7). */
export const BANNED_COPY =
  /\b(should|apply to|best|likely to be invited|people|applicants|some invitations|a few)\b/i;

export function isMasked(i: Interval): boolean {
  return i.min === 0 && i.max === 19;
}

/** A count for tables and chips: "1,132", "under 20" or "872–891". */
export function formatCount(i: Interval): string {
  return isMasked(i) ? "under 20" : formatInterval(i);
}

/** A count inside a sentence; a masked count says it may be zero. */
export function countPhrase(i: Interval): string {
  return isMasked(i) ? "under 20, so may be zero" : formatInterval(i);
}

/** "2026-10" becomes "Oct 2026". */
export function formatMonth(month: MonthKey): string {
  const [year, m] = month.split("-");
  return `${MONTH_NAMES[Number(m) - 1]} ${year}`;
}

/** The YYYY-MM of a valid YYYY-MM-DD calendar date, otherwise null. */
export function submissionMonth(eoiDate: string): MonthKey | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(eoiDate);
  if (!match) return null;
  const [, y, m, d] = match.map(Number);
  const date = new Date(Date.UTC(y, m - 1, d));
  const valid =
    date.getUTCFullYear() === y &&
    date.getUTCMonth() === m - 1 &&
    date.getUTCDate() === d;
  return valid ? eoiDate.slice(0, 7) : null;
}
