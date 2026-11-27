import type { RecapFacts } from "./types";
import { dayText, formatNumber } from "./format";

/**
 * The newest 189 round in the recap facts, as the figures other pages quote
 * (audit A-P1-6): the guide's "Is 65 points enough?", the 189 short answer,
 * the homepage and the occupation hubs. Read from the frozen facts files at
 * build, so the monthly job refreshes every quote with no hand-typed figure.
 */
export type LatestRound = {
  /** YYYY-MM-DD. */
  date: string;
  /** The round's published 189 "Total EOIs Invited"; null when the table has no 189 row. */
  invited: number | null;
  /** Occupations the round listed (same-code rows merged, as in the recap). */
  occupations: number;
  /** The lowest and highest cut-off any occupation had. */
  lowest: number;
  highest: number;
  /** How many occupations had the lowest cut-off. */
  atLowest: number;
  /** The recap month that holds the round, for links. */
  month: RecapFacts["month"];
};

/** The newest round across every facts file, or null when none has one. */
export function latestRound(recaps: RecapFacts[]): LatestRound | null {
  const rounds = recaps.flatMap((facts) =>
    Object.entries(facts.rounds).map(([date, section]) => ({
      date,
      section,
      month: facts.month,
    })),
  );
  const newest = rounds.reduce<(typeof rounds)[number] | null>(
    (best, r) => (!best || r.date > best.date ? r : best),
    null,
  );
  if (!newest) return null;
  const scores = newest.section.distribution.filter((d) => d.occupations > 0);
  if (scores.length === 0) return null;
  const lowest = Math.min(...scores.map((d) => d.score));
  const highest = Math.max(...scores.map((d) => d.score));
  const total = newest.section.totals.find((t) => t.subclass === "189");
  return {
    date: newest.date,
    invited: total ? total.invited : null,
    occupations: newest.section.occupations.length,
    lowest,
    highest,
    atLowest: scores.find((d) => d.score === lowest)?.occupations ?? 0,
    month: newest.month,
  };
}

/** "65 to 100 points", or "65 points" when every cut-off was the same. */
export function cutoffSpanText(round: LatestRound): string {
  return round.lowest === round.highest
    ? `${round.lowest} points`
    : `${round.lowest} to ${round.highest} points`;
}

/** "invited 20,000 EOIs across 159 occupations" (the EOI total only when published). */
export function invitedClause(round: LatestRound): string {
  const across = `${formatNumber(round.occupations)} ${round.occupations === 1 ? "occupation" : "occupations"}`;
  return round.invited === null
    ? `listed ${across}`
    : `invited ${formatNumber(round.invited)} EOIs across ${across}`;
}

/**
 * "In the 15 Oct 2026 189 round, Home Affairs invited 20,000 EOIs across 159
 * occupations; the lowest score invited ranged from 65 to 100 points by
 * occupation, and 44 occupations were invited at 65."
 */
export function latestRoundSentence(round: LatestRound): string {
  const span =
    round.lowest === round.highest
      ? `every occupation's cut-off was ${round.lowest} points`
      : `the lowest score invited ranged from ${cutoffSpanText(round)} by occupation, and ${formatNumber(round.atLowest)} ${round.atLowest === 1 ? "occupation was" : "occupations were"} invited at ${round.lowest}`;
  return `In the ${dayText(round.date)} 189 round, Home Affairs ${invitedClause(round)}; ${span}.`;
}

/** "Latest 189 round: 15 Oct 2026, 20,000 EOIs invited across 159 occupations." */
export function latestRoundLine(round: LatestRound): string {
  const across = `${formatNumber(round.occupations)} ${round.occupations === 1 ? "occupation" : "occupations"}`;
  const what =
    round.invited === null
      ? `${across} listed`
      : `${formatNumber(round.invited)} EOIs invited across ${across}`;
  return `Latest 189 round: ${dayText(round.date)}, ${what}.`;
}
