import { shiftMonth } from "../data/months";
import { parseCountText, sumIntervals } from "../data/published-count";
import type {
  EoiStatus,
  Interval,
  MonthKey,
  OccupationCore,
  ScoreCounts,
  Visa,
} from "../data/types";
import type { DataSection, MonthPair, ScoreTotal } from "./types";

export const VISAS: readonly Visa[] = ["189", "190", "491"];

/**
 * The cores published in `month`. A core carried forward from an older month
 * (an occupation that dropped out of the data) holds that month's figures and
 * is left out of every sum (R6).
 */
export function coresAsAt(
  cores: readonly OccupationCore[],
  month: MonthKey,
): OccupationCore[] {
  return cores.filter((core) => core.asAt === month);
}

/**
 * One visa's national total for one status in one month: the sum over
 * occupations as an interval ("<20" is 0–19). Null when no occupation has
 * the month fetched, which is "not published", never zero.
 */
function monthTotal(
  cores: readonly OccupationCore[],
  visa: Visa,
  month: MonthKey,
  status: EoiStatus,
): Interval | null {
  const fetched = cores
    .map((core) => core.statusHistory[visa]?.[month])
    .filter((cell) => cell !== undefined);
  if (fetched.length === 0) return null;
  return sumIntervals(
    fetched.map((cell) => parseCountText(cell[status] ?? "0")),
  );
}

function monthPair(
  cores: readonly OccupationCore[],
  visa: Visa,
  month: MonthKey,
  status: EoiStatus,
): MonthPair {
  return {
    current: monthTotal(cores, visa, month, status) ?? { min: 0, max: 0 },
    previous: monthTotal(cores, visa, shiftMonth(month, -1), status),
  };
}

/**
 * SUBMITTED and INVITED per visa, this month and last. Each figure sums one
 * visa in one month: INVITED is a stock, never added across months or visas.
 */
export function nationalFigures(
  cores: readonly OccupationCore[],
  month: MonthKey,
): DataSection["national"] {
  const current = coresAsAt(cores, month);
  const entry = (visa: Visa) => ({
    submitted: monthPair(current, visa, month, "SUBMITTED"),
    invited: monthPair(current, visa, month, "INVITED"),
  });
  return { "189": entry("189"), "190": entry("190"), "491": entry("491") };
}

/**
 * One visa's counts by score, lowest score first: the pool (SUBMITTED at the
 * as-at month, the only month published by score) or the month's INVITED.
 */
export function scoreTotals(
  cores: readonly OccupationCore[],
  month: MonthKey,
  visa: Visa,
  kind: "pool" | "invited",
): ScoreTotal[] {
  const byScore = new Map<number, Interval[]>();
  for (const core of coresAsAt(cores, month)) {
    const counts: ScoreCounts | undefined =
      kind === "pool"
        ? core.pool[visa]?.byScore
        : core.invitedByScore[visa]?.[month];
    for (const [score, text] of Object.entries(counts ?? {})) {
      const key = Number(score);
      byScore.set(key, [...(byScore.get(key) ?? []), parseCountText(text)]);
    }
  }
  return [...byScore]
    .map(([score, counts]) => ({ score, count: sumIntervals(counts) }))
    .sort((a, b) => a.score - b.score);
}
