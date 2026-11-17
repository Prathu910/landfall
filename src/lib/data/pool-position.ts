import { normalizePoolScore } from "../pool";
import { countIn, parseCountText, sumIntervals } from "./published-count";
import type {
  Interval,
  MonthKey,
  OccupationCore,
  OccupationDetail,
  Visa,
} from "./types";

export type PoolPosition =
  | { available: false; reason: "no-eois-for-visa" }
  | {
      available: true;
      asAt: MonthKey;
      score: number; // normalised to the 5-point band
      higher: Interval;
      same: Interval;
      total: Interval;
      sameSubmitted?: {
        before: Interval;
        sameMonth: Interval;
        after: Interval;
        approximate: true;
      };
    };

function sameScoreSplit(
  byMonth: Record<string, string>,
  submittedMonth: MonthKey,
): NonNullable<Extract<PoolPosition, { available: true }>["sameSubmitted"]> {
  const before: Interval[] = [];
  const after: Interval[] = [];
  for (const [month, text] of Object.entries(byMonth)) {
    if (month === submittedMonth) continue;
    const count = parseCountText(text);
    // "older" predates every month key, so it counts as before.
    (month === "older" || month < submittedMonth ? before : after).push(count);
  }
  return {
    before: sumIntervals(before),
    sameMonth: countIn(byMonth, submittedMonth) ?? { min: 0, max: 0 },
    after: sumIntervals(after),
    approximate: true,
  };
}

export function poolPosition(
  core: OccupationCore,
  detail: OccupationDetail | null,
  visa: Visa,
  score: number,
  submittedMonth: MonthKey | null,
): PoolPosition {
  const pool = core.pool[visa];
  if (!pool) return { available: false, reason: "no-eois-for-visa" };

  const normalised = normalizePoolScore(score);
  const key = String(normalised);
  const higher: Interval[] = [];
  for (const [rowScore, text] of Object.entries(pool.byScore)) {
    const count = parseCountText(text);
    if (Number(rowScore) > normalised) higher.push(count);
  }

  const result: Extract<PoolPosition, { available: true }> = {
    available: true,
    asAt: core.asAt,
    score: normalised,
    higher: sumIntervals(higher),
    same: countIn(pool.byScore, key) ?? { min: 0, max: 0 },
    total: parseCountText(pool.total),
  };

  const byMonth = detail?.cohortsByScore[visa]?.[key];
  if (byMonth && submittedMonth) {
    result.sameSubmitted = sameScoreSplit(byMonth, submittedMonth);
  }
  return result;
}
