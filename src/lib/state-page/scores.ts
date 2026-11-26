import { addIntervals, parseCountText } from "../data/published-count";
import type {
  Interval,
  MonthKey,
  OccupationCore,
  StateCode,
  StateVisa,
} from "../data/types";
import type { PoolView } from "../updates/data-view";
import { dayText, intervalText, monthEnd } from "../updates/format";

export type ScoreSum = { score: number; count: Interval };

const PASS_MARK = 65;

/** The state's INVITED counts at each score in one month, summed over occupations; ascending. */
export function stateScoreSums(
  cores: readonly OccupationCore[],
  visa: StateVisa,
  state: StateCode,
  month: MonthKey,
): ScoreSum[] {
  const sums = new Map<number, Interval>();
  for (const core of cores) {
    const counts = core.stateInvited[visa]?.[state]?.[month] ?? {};
    for (const [score, text] of Object.entries(counts)) {
      const key = Number(score);
      const count = parseCountText(text);
      const sum = sums.get(key);
      sums.set(key, sum ? addIntervals(sum, count) : count);
    }
  }
  return [...sums.entries()]
    .sort(([a], [b]) => a - b)
    .map(([score, count]) => ({ score, count }));
}

/** The lowest score with a published count (20 or more for some occupation); null when none. */
export function lowestPublishedScore(sums: readonly ScoreSum[]): number | null {
  return sums.find((s) => s.count.min > 0)?.score ?? null;
}

/**
 * The chart's bars, trimmed as the recap's 189 chart: from one score below
 * the first published to one above the last; every score when none is.
 */
export function stateScoreView(
  sums: readonly ScoreSum[],
  visa: StateVisa,
  searchName: string,
  month: MonthKey,
): PoolView {
  const first = sums.findIndex((s) => s.count.min > 0);
  const last = sums.findLastIndex((s) => s.count.min > 0);
  const shown =
    first === -1 ? sums : sums.slice(Math.max(0, first - 1), last + 2);
  const tallest = Math.max(1, ...shown.map((s) => s.count.max));
  return {
    heading: `${searchName} ${visa}: points of EOIs holding an invitation, ${dayText(monthEnd(month))}`,
    bars: shown.map(({ score, count }) => ({
      score: String(score),
      label: intervalText(count),
      minShare: count.min / tallest,
      maxShare: count.max / tallest,
      passMark: score === PASS_MARK,
    })),
    key: {
      published: "published counts",
      hidden: "plus hidden counts (under 20 each, may be zero)",
    },
    caption:
      "Each bar sums every occupation at that score: the solid part is published, the hatched part is counts under 20, which may be zero. Scores include the nomination points.",
  };
}
