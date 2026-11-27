import { positiveScoreRange } from "../data/invitations";
import { calendarMonths } from "../data/months";
import { stateInvitedCell } from "../data/state-totals";
import type {
  Interval,
  MonthKey,
  OccupationCore,
  StateCode,
  StateVisa,
} from "../data/types";
import { SERIES_MONTHS } from "./series";

export type StateOccupationRow = {
  code: string;
  name: string;
  /** The latest month's INVITED interval for the state; null when not fetched. */
  latest: Interval | null;
  /** Lowest and highest score with a published count in the latest month. */
  publishedScores: { min: number; max: number } | null;
  /** Months of the window with a published count (20 or more at some score). */
  monthsWith20: number;
};

export const TOP_ROWS = 10;

function row(
  core: OccupationCore,
  visa: StateVisa,
  state: StateCode,
  window: readonly MonthKey[],
  asAt: MonthKey,
): StateOccupationRow {
  const latestCounts = core.stateInvited[visa]?.[state]?.[asAt];
  return {
    code: core.code,
    name: core.name,
    latest: stateInvitedCell(core, visa, state, asAt)?.total ?? null,
    publishedScores: latestCounts ? positiveScoreRange([latestCounts]) : null,
    monthsWith20: window.filter(
      (month) =>
        (stateInvitedCell(core, visa, state, month)?.total.min ?? 0) > 0,
    ).length,
  };
}

/**
 * Occupations with a published INVITED count for the state, latest floor
 * first, then the most months with a published count, then by code. Only
 * rows of 20 or more are ranked: a "<20" cell may be zero.
 */
export function topStateOccupations(
  cores: readonly OccupationCore[],
  visa: StateVisa,
  state: StateCode,
  asAt: MonthKey,
  limit = TOP_ROWS,
): { rows: StateOccupationRow[]; withPublished: number } {
  const window = calendarMonths(asAt, SERIES_MONTHS);
  const rows = cores
    .map((core) => row(core, visa, state, window, asAt))
    .filter((r) => (r.latest?.min ?? 0) > 0 || r.monthsWith20 > 0)
    .sort(
      (a, b) =>
        (b.latest?.min ?? 0) - (a.latest?.min ?? 0) ||
        b.monthsWith20 - a.monthsWith20 ||
        (a.code < b.code ? -1 : 1),
    );
  return { rows: rows.slice(0, limit), withPublished: rows.length };
}
