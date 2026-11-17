import type {
  OccupationEvidence,
  PathwayEvidence,
  TrendEvidence,
  VisaPathway,
} from "../report-evidence";
import { calendarMonths, splitCoverage } from "./months";
import { parseCountText } from "./published-count";
import { monthEnd } from "./report-source";
import type { CountText, OccupationCore, ScoreCounts } from "./types";

/** Adapters from the all-occupation pipeline to the shapes the current UI reads. */

export type PoolOccupation = {
  code: string;
  name: string;
  points: { score: number; count: CountText }[];
}; // 189 SUBMITTED, ascending score

const LEGACY_ROUNDS = 6;
const LEGACY_TREND_MONTHS = 12;
const PATHWAY_VISAS: readonly VisaPathway[] = ["189", "190", "491"];

function pointsAscending(byScore: ScoreCounts): PoolOccupation["points"] {
  return Object.entries(byScore)
    .map(([score, count]) => ({ score: Number(score), count }))
    .sort((a, b) => a.score - b.score);
}

/** Null when the occupation has no 189 pool. */
export function toPoolOccupation(core: OccupationCore): PoolOccupation | null {
  const pool = core.pool["189"];
  if (!pool) return null;
  return {
    code: core.code,
    name: core.name,
    points: pointsAscending(pool.byScore),
  };
}

/**
 * The last 12 calendar months to core.asAt. A fetched month with no SUBMITTED
 * row is zero; a month that was not fetched is left out.
 */
function trendFor(core: OccupationCore): TrendEvidence[] {
  const history = core.statusHistory["189"];
  const { covered } = splitCoverage(
    calendarMonths(core.asAt, LEGACY_TREND_MONTHS),
    history,
  );
  return covered.map((month) => {
    const submitted = history?.[month]?.SUBMITTED;
    return {
      date: monthEnd(month),
      total:
        submitted === undefined
          ? { min: 0, max: 0 }
          : parseCountText(submitted),
    };
  });
}

function pathwaysFor(core: OccupationCore): PathwayEvidence[] {
  return PATHWAY_VISAS.flatMap((visa) => {
    const pool = core.pool[visa];
    return pool
      ? [
          {
            visa,
            total: parseCountText(pool.total),
            points: pointsAscending(pool.byScore),
          },
        ]
      : [];
  });
}

export function toOccupationEvidence(core: OccupationCore): OccupationEvidence {
  return {
    code: core.code,
    name: core.name,
    rounds: core.rounds189.slice(0, LEGACY_ROUNDS),
    trend: trendFor(core),
    pathways: pathwaysFor(core),
  };
}
