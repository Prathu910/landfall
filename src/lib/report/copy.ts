import type { Interval, MonthKey } from "../data/types";
import { MONTH_NAMES } from "../migration";
import { READ_BANNED } from "../outlook/read-contract";
import { formatInterval } from "../pool";

/** Wording the report must never use (spec section 7). */
export const BANNED_COPY =
  /\b(should|apply to|best|likely to be invited|people|applicants|some invitations|a few)\b/i;

/**
 * Wording the redesigned report must never use (spec 10). It allows "best"
 * and "should"; the footer's "guarantee" is fixed text checked on its own.
 * The old BANNED_COPY stays for modules the homepage and occupation pages use.
 */
export const REPORT_BANNED_COPY = READ_BANNED;

/** A caveat with a link to the methodology section that explains it. */
export type LinkedNote = { text: string; link: { href: string; text: string } };

/** Shown wherever a higher-score count could read as a place in a queue. */
export const QUEUE_NOTE: LinkedNote = {
  text: "Counts of EOIs with a higher score, not your place in a queue: ties use an unpublished date of effect, and one person can hold several EOIs.",
  link: { href: "/methodology/#pool", text: "How to read the pool" },
};

export function isMasked(i: Interval): boolean {
  return i.min === 0 && i.max === 19;
}

/** A count for tables and chips: "1,132", "under 20" or "872–891". */
export function formatCount(i: Interval): string {
  return isMasked(i) ? "under 20" : formatInterval(i);
}

/** A count mid-sentence: "1,132", or "under 20 (so may be zero)" when masked. */
export function countInSentence(i: Interval): string {
  return isMasked(i) ? "under 20 (so may be zero)" : formatInterval(i);
}

/**
 * One sentence about one count: "{lead}{count}{tail}{after}.". Without a lead
 * the count opens the sentence and is capitalised; a masked count ends with
 * ", so this may be zero".
 */
export function countClause(
  count: Interval,
  tail: string,
  lead = "",
  after = "",
): string {
  const text = formatCount(count);
  const body = lead
    ? `${lead}${text}${tail}${after}`
    : `${text[0].toUpperCase()}${text.slice(1)}${tail}${after}`;
  return `${body}${isMasked(count) ? ", so this may be zero" : ""}.`;
}

/** "2026-10" becomes "Oct 2026". */
export function formatMonth(month: MonthKey): string {
  const [year, m] = month.split("-");
  return `${MONTH_NAMES[Number(m) - 1]} ${year}`;
}

/** For an EOI month later than the snapshot's as-at month. */
export function afterSnapshotText(month: MonthKey, asAt: MonthKey): string {
  return `Your EOI month (${formatMonth(month)}) is after this snapshot (as at ${formatMonth(asAt)}), so it isn't in the published data yet.`;
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
