import type {
  MonthKey,
  OccupationCore,
  OccupationIndexEntry,
} from "../data/types";
import { formatDate } from "../migration";
import { summarise189Rounds } from "../report/round-status";
import { formatNumber } from "../updates/format";

/**
 * The /occupations/ index as an answer page (audit A-P2-9): its opening
 * sentence and the largest 189 pools, every figure from the cores.
 */

export type LargePool = {
  code: string;
  name: string;
  path: string;
  /** The published 189 pool total; masked totals never qualify. */
  pool: number;
  /** The latest cut-off in the last four rounds, or null when not listed in them. */
  latest: { date: string; cutoff: number } | null;
};

/**
 * Index entries still in the snapshot: an entry with `lastAsAt` was
 * dropped and is carried forward, so sums, rankings and counts skip it
 * (docs/DATA.md, "Dropped occupations").
 */
export function currentEntries<
  T extends Pick<OccupationIndexEntry, "lastAsAt">,
>(index: readonly T[]): T[] {
  return index.filter((entry) => entry.lastAsAt === undefined);
}

/**
 * The `count` largest exact 189 pools in the `asAt` snapshot, largest
 * first (ties A to Z). A core from another month never ranks.
 */
export function largest189Pools(
  cores: { core: OccupationCore; path: string }[],
  asAt: MonthKey,
  count = 20,
): LargePool[] {
  return cores
    .flatMap(({ core, path }) => {
      if (core.asAt !== asAt) return [];
      const total = core.pool["189"]?.total;
      if (!total || total === "<20") return [];
      const listed = summarise189Rounds(core.rounds189).latestCutoffInLastFour;
      return [
        {
          code: core.code,
          name: core.name,
          path,
          pool: Number(total),
          latest: listed ? { date: listed.date, cutoff: listed.cutoff } : null,
        },
      ];
    })
    .sort((a, b) => b.pool - a.pool || a.name.localeCompare(b.name))
    .slice(0, count);
}

/**
 * "493 occupations are in the 31 Oct 2026 SkillSelect snapshot, 479 with
 * published data; the latest 189 round, on 15 Oct 2026, listed 159 occupations."
 */
export function directoryAnswer(input: {
  total: number;
  withData: number;
  asAt: string;
  round: { date: string; occupations: number } | null;
}): string {
  const base = `${formatNumber(input.total)} occupations are in the ${formatDate(input.asAt)} SkillSelect snapshot, ${formatNumber(input.withData)} with published data`;
  if (!input.round) return `${base}.`;
  return `${base}; the latest 189 round, on ${formatDate(input.round.date)}, listed ${formatNumber(input.round.occupations)} occupations.`;
}
