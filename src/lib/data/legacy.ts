import type {
  OccupationEvidence,
  PathwayEvidence,
  TrendEvidence,
  VisaPathway,
} from "../report-evidence";
import { parseCountText } from "./published-count";
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

/** Last calendar day of a "YYYY-MM" month, as YYYY-MM-DD. */
function monthEnd(month: string): string {
  const [year, mon] = month.split("-").map(Number);
  const day = new Date(Date.UTC(year, mon, 0)).getUTCDate();
  return `${month}-${String(day).padStart(2, "0")}`;
}

function trendFor(core: OccupationCore): TrendEvidence[] {
  const history = core.statusHistory["189"] ?? {};
  return Object.keys(history)
    .sort()
    .flatMap((month) => {
      const submitted = history[month]?.SUBMITTED;
      return submitted === undefined
        ? []
        : [{ date: monthEnd(month), total: parseCountText(submitted) }];
    })
    .slice(-LEGACY_TREND_MONTHS);
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
