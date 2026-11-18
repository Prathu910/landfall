export type RoundStatus = "regular" | "occasional" | "none";

type DatedCutoff = { date: string; cutoff: number };

export type RoundSummary = {
  status: RoundStatus;
  listedInLastFour: number;
  roundsConsidered: number;
  /** Newest listed cut-off in any parsed round. */
  latestCutoff: DatedCutoff | null;
  latestCutoffInLastFour: DatedCutoff | null;
};

export const CHIP_LABEL: Record<RoundStatus, string> = {
  regular: "Regular invitations",
  occasional: "Occasional invitations",
  none: "No recent invitations",
};

type Round = { date: string; cutoff: number | null };

function firstListed(rounds: Round[]): DatedCutoff | null {
  for (const round of rounds) {
    if (round.cutoff !== null) {
      return { date: round.date, cutoff: round.cutoff };
    }
  }
  return null;
}

/** Summarises 189 rounds (newest first). A null cut-off means not listed. */
export function summarise189Rounds(rounds189: Round[]): RoundSummary {
  const lastFour = rounds189.slice(0, 4);
  const listedInLastFour = lastFour.filter((r) => r.cutoff !== null).length;
  const status: RoundStatus =
    lastFour.length > 0 && listedInLastFour === lastFour.length
      ? "regular"
      : listedInLastFour > 0
        ? "occasional"
        : "none";
  return {
    status,
    listedInLastFour,
    roundsConsidered: lastFour.length,
    latestCutoff: firstListed(rounds189),
    latestCutoffInLastFour: firstListed(lastFour),
  };
}
