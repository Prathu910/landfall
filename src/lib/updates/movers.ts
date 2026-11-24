import { shiftMonth } from "../data/months";
import type { CountText, MonthKey, OccupationCore } from "../data/types";
import { coresAsAt } from "./facts-national";
import type { PoolMove } from "./types";

/** The month's exact 189 pool, or null when masked ("<20") or not fetched. */
export function exactPool189(
  core: OccupationCore,
  month: MonthKey,
): number | null {
  const cell = core.statusHistory["189"]?.[month];
  if (cell === undefined) return null;
  const text: CountText = cell.SUBMITTED ?? "0";
  return text === "<20" ? null : Number(text);
}

const size = (m: PoolMove): number => Math.abs(m.current - m.previous);
const largestFirst = (a: PoolMove, b: PoolMove): number =>
  size(b) - size(a) || (a.code < b.code ? -1 : 1);

/**
 * The 189 pools that fell and rose most from last month, exact counts only:
 * an occupation masked or not fetched in either month is left out.
 */
export function poolMovers(
  cores: readonly OccupationCore[],
  month: MonthKey,
  limit = 6,
): { fell: PoolMove[]; rose: PoolMove[] } {
  const previousMonth = shiftMonth(month, -1);
  const moves = coresAsAt(cores, month).flatMap((core) => {
    const previous = exactPool189(core, previousMonth);
    const current = exactPool189(core, month);
    if (previous === null || current === null || previous === current) {
      return [];
    }
    return [{ code: core.code, name: core.name, previous, current }];
  });
  return {
    fell: moves
      .filter((m) => m.current < m.previous)
      .sort(largestFirst)
      .slice(0, limit),
    rose: moves
      .filter((m) => m.current > m.previous)
      .sort(largestFirst)
      .slice(0, limit),
  };
}
