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
  months: MonthlyInvited[];
  lastConfirmedMonth: MonthKey | null;
  lastPossibleMonth: MonthKey | null;
  scoreRange: { min: number; max: number } | null;
};

export function latestMonthKeys(
  byMonth: Record<MonthKey, unknown>,
  count: number,
): MonthKey[] {
  return Object.keys(byMonth).sort().slice(-count);
}

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

export function invitationActivity(
  core: OccupationCore,
  visa: Visa,
): InvitationActivity {
  const history = core.statusHistory[visa];
  if (!history) {
    return {
      months: [],
      lastConfirmedMonth: null,
      lastPossibleMonth: null,
      scoreRange: null,
    };
  }
  const months: MonthlyInvited[] = Object.keys(history)
    .sort()
    .map((asAt) => {
      const text = history[asAt].INVITED;
      return {
        asAt,
        invitedAtLeast: text ? parseCountText(text) : { min: 0, max: 0 },
      };
    });
  const last = (test: (i: Interval) => boolean): MonthKey | null =>
    [...months].reverse().find((m) => test(m.invitedAtLeast))?.asAt ?? null;

  const byScore = core.invitedByScore[visa] ?? {};
  const recent = latestMonthKeys(byScore, 12).map((key) => byScore[key]);
  return {
    months,
    lastConfirmedMonth: last((i) => i.min > 0),
    lastPossibleMonth: last((i) => i.max > 0),
    scoreRange: positiveScoreRange(recent),
  };
}
