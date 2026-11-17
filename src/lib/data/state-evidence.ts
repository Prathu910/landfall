import { normalizePoolScore } from "../pool";
import { positiveScoreRange } from "./invitations";
import type { MonthlyInvited } from "./invitations";
import { calendarMonths, splitCoverage } from "./months";
import { parseCountText, sumIntervals } from "./published-count";
import type {
  Interval,
  MonthKey,
  OccupationCore,
  ScoreCounts,
  StateCode,
  StateKey,
  StateVisa,
} from "./types";

export type StateSide = {
  competitorsAtOrAbove: Interval;
  invitedAtOrBelow: MonthlyInvited[]; // fetched months in the window, oldest first
  notPublished: MonthKey[]; // window months that were not fetched
  peak: MonthlyInvited | null; // null unless some month confirms an invitation
  scoreRange: { min: number; max: number } | null;
};

function sumScores(
  counts: ScoreCounts,
  include: (score: number) => boolean,
): Interval {
  return sumIntervals(
    Object.entries(counts)
      .filter(([score]) => include(Number(score)))
      .map(([, text]) => parseCountText(text)),
  );
}

/** The latest month with the highest confirmed (min > 0) count. */
function peakMonth(months: MonthlyInvited[]): MonthlyInvited | null {
  return months.reduce<MonthlyInvited | null>((best, m) => {
    if (m.invitedAtLeast.min === 0) return best;
    // Strictly-greater comparison on ascending months would keep the earlier tie.
    return best === null || m.invitedAtLeast.min >= best.invitedAtLeast.min
      ? m
      : best;
  }, null);
}

function side(
  core: OccupationCore,
  visa: StateVisa,
  key: StateKey,
  score: number,
  months: number,
): StateSide {
  const pool = core.statePool[visa]?.[key];
  const invited = core.stateInvited[visa]?.[key];
  const { covered, notPublished } = splitCoverage(
    calendarMonths(core.asAt, months),
    invited,
  );
  const cells = covered.map((asAt) => invited?.[asAt] ?? {});
  const invitedAtOrBelow = covered.map((asAt, i) => ({
    asAt,
    invitedAtLeast: sumScores(cells[i], (s) => s <= score),
  }));
  return {
    competitorsAtOrAbove: pool
      ? sumScores(pool, (s) => s >= score)
      : { min: 0, max: 0 },
    invitedAtOrBelow,
    notPublished,
    peak: peakMonth(invitedAtOrBelow),
    scoreRange: positiveScoreRange(cells),
  };
}

export function stateEvidence(
  core: OccupationCore,
  visa: StateVisa,
  state: StateCode,
  score: number,
  months = 12,
): { state: StateSide; anyState: StateSide } {
  const normalised = normalizePoolScore(score);
  return {
    state: side(core, visa, state, normalised, months),
    anyState: side(core, visa, "ANY", normalised, months),
  };
}
