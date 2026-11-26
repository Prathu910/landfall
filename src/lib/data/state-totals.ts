import { parseCountText, sumIntervals } from "./published-count";
import type {
  Interval,
  MonthKey,
  OccupationCore,
  StateKey,
  StateVisa,
} from "./types";

/** One occupation's INVITED cells for a state in a month, summed as an interval. */
export type StateInvitedCell = { total: Interval; masked: number };

/**
 * One occupation's INVITED cells for a state in a month; undefined when the
 * month was not fetched for it. A fetched month with no rows is `{}`, so its
 * total is an exact zero with no hidden cells.
 */
export function stateInvitedCell(
  core: OccupationCore,
  visa: StateVisa,
  state: StateKey,
  month: MonthKey,
): StateInvitedCell | undefined {
  const counts = core.stateInvited[visa]?.[state]?.[month];
  if (counts === undefined) return undefined;
  const texts = Object.values(counts);
  return {
    total: sumIntervals(texts.map(parseCountText)),
    masked: texts.filter((text) => text === "<20").length,
  };
}
