import { generate, type GeneratedData } from "./generate";
import type { RoundPages } from "./rounds";

/**
 * The 2026-10 snapshot as first published. Tests regenerate it in memory from
 * the permanent raw history so later monthly imports (which replace src/data)
 * cannot break them.
 */
export const FROZEN_2026_10 = {
  asAt: "2026-10",
  checkedAt: "2026-11-17",
  roundsUpTo: "2026-10-31",
  revisionsUpTo: "2026-11-17",
} as const;

export function generateFrozenSnapshot(
  rawRoot: string,
  rounds: RoundPages,
): GeneratedData {
  const upTo = (date: string) => date <= FROZEN_2026_10.roundsUpTo;
  return generate({
    rawRoot,
    asAt: FROZEN_2026_10.asAt,
    checkedAt: FROZEN_2026_10.checkedAt,
    rounds: {
      rounds: rounds.rounds.filter((round) => upTo(round.date)),
      skipped: rounds.skipped.filter((round) => upTo(round.date)),
    },
    importVersion: "frozen-2026-10",
    revisionsUpTo: FROZEN_2026_10.revisionsUpTo,
  });
}
