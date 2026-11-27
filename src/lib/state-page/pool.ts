import { parseCountText, sumIntervals } from "../data/published-count";
import type {
  Interval,
  OccupationCore,
  StateCode,
  StateVisa,
} from "../data/types";

/**
 * EOIs waiting (SUBMITTED) that name the state for the visa in the latest
 * month, summed over occupations and scores. They are EOIs, not people: one
 * EOI can name several states, so states are never added together. Null
 * when no core has the state.
 */
export function statePoolTotal(
  cores: readonly OccupationCore[],
  visa: StateVisa,
  state: StateCode,
): Interval | null {
  const cells = cores.flatMap((core) => {
    const counts = core.statePool[visa]?.[state];
    return counts ? Object.values(counts).map(parseCountText) : [];
  });
  const named = cores.some((core) => core.statePool[visa]?.[state]);
  return named ? sumIntervals(cells) : null;
}
