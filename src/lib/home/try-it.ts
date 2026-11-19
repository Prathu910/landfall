import { poolPosition } from "../data/pool-position";
import type { OccupationCore } from "../data/types";
import { countInSentence, formatMonth } from "../report/copy";
import { buildRounds } from "../report/panel-189";
import { CHIP_LABEL, summarise189Rounds } from "../report/round-status";
import { AT_SCORE_LABEL, EOI_CAVEAT } from "../report/scorecard";

/** Points offered by the homepage try-it: 65 to 140 in steps of 5. */
export const TRY_IT_POINTS: number[] = Array.from(
  { length: 16 },
  (_, i) => 65 + i * 5,
);
export const TRY_IT_DEFAULT = 75;
/** The occupation the try-it opens on: Registered Nurses nec, the sample's occupation. */
export const TRY_IT_OCCUPATION = "254499";

export const TRY_IT_NO_DATA = "No published 189 data for this occupation";
/** Shown when the occupation's file could not be fetched or was invalid. */
export const TRY_IT_LOAD_FAILED =
  "Couldn't load the published data for this occupation. Reload the page or choose another occupation.";
export const TRY_IT_ROW_LABELS = {
  higher: "EOIs with a higher score (189)",
  same: AT_SCORE_LABEL,
  latestRound: "Latest 189 round",
} as const;
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
      /** The EOI caveat plus the published pool total. */
      note: string;
      /** "SkillSelect, as at {Mon YYYY}.". */
      source: string;
    }
  | { kind: "none"; message: string };

/** The 189 pool beside a points total, read exactly as the report reads it. */
export function buildTryIt(
  core: OccupationCore | null,
  total: number,
): TryItView {
  // The report's own pool position, so the published total is used, not a row sum.
  const position = core && poolPosition(core, null, "189", total, null);
  if (!core || !position?.available)
    return { kind: "none", message: TRY_IT_NO_DATA };
  const { higher, same, total: poolTotal } = position;
  const newest = buildRounds(core, []).tiles[0];
  const asAt = formatMonth(core.asAt);
  const poolText = countInSentence(poolTotal);
  return {
    kind: "data",
    higher: countInSentence(higher),
    same: countInSentence(same),
    poolTotal: poolText,
    roundStatus: CHIP_LABEL[summarise189Rounds(core.rounds189).status],
    latestRound: newest ? `${newest.value}, ${newest.label}` : NO_ROUNDS,
    asAt,
    note: `${EOI_CAVEAT} ${poolText} EOIs in the 189 pool.`,
    source: `SkillSelect, as at ${asAt}.`,
  };
}
