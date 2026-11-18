import { poolPosition } from "../data/pool-position";
import type { OccupationCore } from "../data/types";
import { countInSentence, formatMonth } from "../report/copy";
import { buildRounds } from "../report/panel-189";
import { CHIP_LABEL, summarise189Rounds } from "../report/round-status";

/** Points offered by the homepage try-it: 65 to 140 in steps of 5. */
export const TRY_IT_POINTS: number[] = Array.from(
  { length: 16 },
  (_, i) => 65 + i * 5,
);
export const TRY_IT_DEFAULT = 85;

const NO_DATA = "No published 189 data for this occupation";
const NO_ROUNDS = "Not listed in any round we can read";

export type TryItView =
  | {
      kind: "data";
      higher: string;
      same: string;
      poolTotal: string;
      /** The 189 card's chip label for this occupation. */
      roundStatus: string;
      /** The newest round in the report's rounds wording; a null cut-off is "Not listed". */
      latestRound: string;
      asAt: string;
    }
  | { kind: "none"; message: string };

/** The 189 pool beside a points total, read exactly as the report reads it. */
export function buildTryIt(
  core: OccupationCore | null,
  total: number,
): TryItView {
  // The report's own pool position, so the published total is used, not a row sum.
  const position = core && poolPosition(core, null, "189", total, null);
  if (!core || !position?.available) return { kind: "none", message: NO_DATA };
  const { higher, same, total: poolTotal } = position;
  const newest = buildRounds(core, []).tiles[0];
  return {
    kind: "data",
    higher: countInSentence(higher),
    same: countInSentence(same),
    poolTotal: countInSentence(poolTotal),
    roundStatus: CHIP_LABEL[summarise189Rounds(core.rounds189).status],
    latestRound: newest ? `${newest.value}, ${newest.label}` : NO_ROUNDS,
    asAt: formatMonth(core.asAt),
  };
}
