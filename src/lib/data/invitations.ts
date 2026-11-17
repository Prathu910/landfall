import { calendarMonths, splitCoverage } from "./months";
import { isPositive, parseCountText } from "./published-count";
import type {
  Interval,
  MonthKey,
  OccupationCore,
  ScoreCounts,
  Visa,
} from "./types";

/** Lower bound: the INVITED stock at that as-at snapshot. Never summed across months. */
export type MonthlyInvited = { asAt: MonthKey; invitedAtLeast: Interval };

export type InvitationActivity = {
  months: MonthlyInvited[]; // fetched months in the window, oldest first
  notPublished: MonthKey[]; // window months that were not fetched
  lastConfirmedMonth: MonthKey | null;
  lastPossibleMonth: MonthKey | null;
  scoreRange: { min: number; max: number } | null;
};

/** The dashboard keeps 24 as-at months. */
const HISTORY_MONTHS = 24;
const SCORE_RANGE_MONTHS = 12;

/** Min and max score among cells with a positive (min > 0) count. */
export function positiveScoreRange(
  cells: ScoreCounts[],
): { min: number; max: number } | null {
  const scores = cells.flatMap((counts) =>
    Object.entries(counts)
      .filter(([, text]) => isPositive(parseCountText(text)))
      .map(([score]) => Number(score)),
  );
  if (scores.length === 0) return null;
  return { min: Math.min(...scores), max: Math.max(...scores) };
}

/**
 * INVITED per as-at month over the `months` calendar months ending at
 * core.asAt. A fetched month with no INVITED row is zero.
 */
export function invitationActivity(
  core: OccupationCore,
  visa: Visa,
  months = HISTORY_MONTHS,
): InvitationActivity {
  const history = core.statusHistory[visa];
  const { covered, notPublished } = splitCoverage(
    calendarMonths(core.asAt, months),
    history,
  );
  const perMonth: MonthlyInvited[] = covered.map((asAt) => {
    const text = history?.[asAt]?.INVITED;
    return {
      asAt,
      invitedAtLeast: text ? parseCountText(text) : { min: 0, max: 0 },
    };
  });
  const last = (test: (i: Interval) => boolean): MonthKey | null =>
    perMonth.findLast((m) => test(m.invitedAtLeast))?.asAt ?? null;

  const byScore = core.invitedByScore[visa];
  const recent = splitCoverage(
    calendarMonths(core.asAt, SCORE_RANGE_MONTHS),
    byScore,
  ).covered.map((month) => byScore?.[month] ?? {});
  return {
    months: perMonth,
    notPublished,
    lastConfirmedMonth: last((i) => i.min > 0),
    lastPossibleMonth: last((i) => i.max > 0),
    scoreRange: positiveScoreRange(recent),
  };
}
