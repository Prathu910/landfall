import { normalizePoolScore } from "../pool";
import { latestMonthKeys, positiveScoreRange } from "./invitations";
import type { MonthlyInvited } from "./invitations";
import { parseCountText, sumIntervals } from "./published-count";
import type {
  Interval,
  OccupationCore,
  ScoreCounts,
  StateCode,
  StateKey,
  StateVisa,
} from "./types";

export type StateSide = {
  competitorsAtOrAbove: Interval;
  invitedAtOrBelow: MonthlyInvited[];
  peak: MonthlyInvited | null;
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

function side(
  core: OccupationCore,
  visa: StateVisa,
  key: StateKey,
  score: number,
  months: number,
): StateSide {
  const pool = core.statePool[visa]?.[key];
  const invited = core.stateInvited[visa]?.[key] ?? {};
  const keys = latestMonthKeys(invited, months);

  const invitedAtOrBelow = keys.map((asAt) => ({
    asAt,
    invitedAtLeast: sumScores(invited[asAt], (s) => s <= score),
  }));
  // Strictly-greater comparison on ascending months would keep the earlier tie.
  const peak = invitedAtOrBelow.reduce<MonthlyInvited | null>(
    (best, m) =>
      best === null || m.invitedAtLeast.min >= best.invitedAtLeast.min
        ? m
        : best,
    null,
  );
  return {
    competitorsAtOrAbove: pool
      ? sumScores(pool, (s) => s >= score)
      : { min: 0, max: 0 },
    invitedAtOrBelow,
    peak,
    scoreRange: positiveScoreRange(keys.map((k) => invited[k])),
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
