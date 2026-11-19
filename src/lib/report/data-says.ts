import type { MonthKey, StateCode, StateVisa } from "../data/types";
import { formatDate } from "../migration";
import type { Group } from "../state-outlook/outlook";
import { joinWords } from "../state-outlook/context";
import { formatMonth } from "./copy";
import { summarise189Rounds, type Round } from "./round-status";
import type { ScorecardCard } from "./scorecard";
import type { ChangeItem } from "./what-could-change";

// "What the data says" (design: docs/superpowers/specs/2026-11-19-what-the-data-says-design.md).
// Every sentence restates what the report's own numbers establish: what
// happened, never a forecast, a chance or a recommendation.

/** How many recent 189 rounds the chart and the lever notes look at. */
const CHART_ROUNDS = 6;
const NO_STATE_STANDS_OUT =
  "No state shows strong published evidence for your profile yet.";

function monthOf(date: string): string {
  return formatMonth(date.slice(0, 7) as MonthKey);
}

/** "its last four rounds", "its last 2 rounds", "its last round". */
function lastRounds(n: number, possessive = "its"): string {
  if (n === 1) return `${possessive} last round`;
  // The bottom line spells "four" as the scorecard always has; notes use digits.
  return `${possessive} last ${n === 4 && possessive === "its" ? "four" : n} rounds`;
}

/** The listed cut-offs among the newest `n` rounds; a null cut-off is never 0. */
function listedCutoffs(rounds189: Round[], n: number): number[] {
  return rounds189
    .slice(0, n)
    .flatMap((round) => (round.cutoff === null ? [] : [round.cutoff]));
}

function pointsRange(cutoffs: number[]): string {
  const lo = Math.min(...cutoffs);
  const hi = Math.max(...cutoffs);
  return lo === hi ? `${lo}` : `${lo}–${hi}`;
}

/** The report's opening sentence about 189, from its last four rounds. */
export function bottomLine189(
  name: string,
  rounds189: Round[],
  points: number,
): string {
  const summary = summarise189Rounds(rounds189);
  const latest = summary.latestCutoffInLastFour;
  const window = lastRounds(summary.roundsConsidered);
  if (summary.status === "none" || latest === null) {
    const last = summary.latestCutoff;
    return last
      ? `189 hasn't listed ${name} in ${window}; the last cut-off was ${last.cutoff} points, in ${monthOf(last.date)}.`
      : `189 hasn't listed ${name} in any round we can read.`;
  }
  const which =
    summary.status === "regular"
      ? summary.roundsConsidered === 1
        ? `in ${window}`
        : `in each of ${window}`
      : `in ${summary.listedInLastFour} of ${window}`;
  if (points < latest.cutoff) {
    return `189 listed ${name} ${which}; the latest cut-off was ${latest.cutoff} points, above your ${points}.`;
  }
  const range = pointsRange(listedCutoffs(rounds189, 4));
  return `189 listed ${name} ${which}, at ${range} points, and you have ${points}.`;
}

/** The opening sentence when the snapshot publishes no 189 EOIs for the occupation. */
export function no189PoolLine(name: string): string {
  return `The snapshot publishes no 189 EOIs for ${name}, so its 190 and 491 prospects depend on state nomination.`;
}

export type StateStanding = { group: Group | null; states: StateCode[] };

const GROUP_ORDER: Group[] = [
  "strongest",
  "watching",
  "needs-answers",
  "unverified",
  "not-open",
];

/** A visa's best state group and the states in it, from its outlook tiles. */
export function stateStanding(
  tiles: { state: StateCode; group: Group }[],
): StateStanding {
  for (const group of GROUP_ORDER) {
    const states = tiles.filter((t) => t.group === group).map((t) => t.state);
    if (states.length > 0) return { group, states };
  }
  return { group: null, states: [] };
}

/**
 * The sentence under the bottom line: where the published state evidence is
 * strongest for a profile like the reader's (STRATEGY "Data, not advice").
 */
export function stateLine(s190: StateStanding, s491: StateStanding): string {
  const byVisa: [StateVisa, StateStanding][] = [
    ["190", s190],
    ["491", s491],
  ];
  const strongest = byVisa.filter(([, s]) => s.group === "strongest");
  if (strongest.length > 0) {
    const parts = strongest.map(([visa, s], i) => {
      const where = joinWords(s.states, "and");
      return i === 0
        ? `for ${visa} is strongest in ${where}`
        : `for ${visa} in ${where}`;
    });
    return `For a profile like yours, the published evidence ${parts.join(", and ")}.`;
  }
  const watching = byVisa
    .filter(([, s]) => s.group === "watching")
    .map(([visa, s]) => `${joinWords(s.states, "and")} for ${visa}`);
  return watching.length > 0
    ? `${NO_STATE_STANDS_OUT} Worth watching: ${watching.join("; ")}.`
    : NO_STATE_STANDS_OUT;
}

/** The 190/491 card's chip: the best state group, named. */
export function nominatedChip(standing: StateStanding): ScorecardCard["chip"] {
  const states = standing.states.join(", ");
  switch (standing.group) {
    case "strongest":
      return { label: `Strongest evidence: ${states}`, tone: "green" };
    case "watching":
      // "amber" is the scorecard's watching tone, drawn in the slate watching colours.
      return { label: `Worth watching: ${states}`, tone: "amber" };
    case "needs-answers":
      return { label: "Needs your answers", tone: "neutral" };
    case "unverified":
      return { label: "Rules being checked", tone: "neutral" };
    case "not-open":
      return { label: "Not open to you now", tone: "red" };
    default:
      return { label: "State decides", tone: "neutral" };
  }
}

export type CutoffChart = {
  /** Oldest first; a null cut-off is a round that did not list the occupation. */
  rounds: { label: string; cutoff: number | null }[];
  points: number;
  /** The points axis: both ends and the ticks between, multiples of 5. */
  scale: { lo: number; hi: number; ticks: number[] };
  /** One sentence above the chart. */
  note: string;
  /** The chart in words, for screen readers. */
  description: string;
};

/** 65 to 100 at least, widened to keep every cut-off and the points inside. */
function chartScale(listed: number[], points: number): CutoffChart["scale"] {
  const lo = Math.floor((Math.min(65, points, ...listed) - 5) / 5) * 5;
  const hi = Math.ceil((Math.max(100, points, ...listed) + 5) / 5) * 5;
  const ticks: number[] = [];
  for (let p = lo + 5; p < hi; p += 5) ticks.push(p);
  return { lo, hi, ticks };
}

function chartNote(
  name: string,
  listed: number[],
  rounds: number,
  points: number,
): string {
  const window = lastRounds(rounds, "the");
  if (listed.length === 0) {
    return rounds === 1
      ? `${name} was not listed in the last round.`
      : `${name} was not listed in any of ${window}.`;
  }
  const atOrAbove = listed.filter((c) => c <= points).length;
  const comparison =
    atOrAbove === listed.length
      ? `Your ${points} is at or above every cut-off listed in ${window}.`
      : atOrAbove === 0
        ? `Every cut-off listed in ${window} was above your ${points}.`
        : `Your ${points} is at or above ${atOrAbove} of the ${listed.length} cut-offs listed in ${window}.`;
  const unlisted = rounds - listed.length;
  return unlisted > 0
    ? `${comparison} ${name} was not listed in ${unlisted} of them.`
    : comparison;
}

function chartDescription(
  name: string,
  rounds: CutoffChart["rounds"],
  points: number,
): string {
  const each = rounds.map(
    (x) =>
      `${x.label}: ${x.cutoff === null ? "not listed" : `${x.cutoff} points`}`,
  );
  return `189 cut-offs for ${name}, oldest first: ${each.join("; ")}. Your points: ${points}.`;
}

/** The last six 189 rounds against the reader's points; null without rounds. */
export function buildCutoffChart(
  name: string,
  rounds189: Round[],
  points: number,
): CutoffChart | null {
  const recent = rounds189.slice(0, CHART_ROUNDS);
  if (recent.length === 0) return null;
  const listed = listedCutoffs(rounds189, CHART_ROUNDS);
  const rounds = [...recent].reverse().map((round) => ({
    label: monthOf(round.date),
    cutoff: round.cutoff,
  }));
  return {
    rounds,
    points,
    scale: chartScale(listed, points),
    note: chartNote(name, listed, recent.length, points),
    description: chartDescription(name, rounds, points),
  };
}

export type Lever = { effect: string; tone: "plus" | "minus"; text: string };

type DatedChange = ChangeItem & { date: string };
const isDated = (c: ChangeItem): c is DatedChange => c.date !== null;

/**
 * "Points you could add" and "Dated changes ahead", from the report's change
 * items. A gain that would clear every recent cut-off says so, but only while
 * 189 still lists the occupation: with no recent listing the note would read
 * as a way in that the rounds don't show.
 */
export function buildLevers(
  changes: ChangeItem[],
  rounds189: Round[],
  points: number,
): { add: Lever[]; dated: Lever[] } {
  const listed = listedCutoffs(rounds189, CHART_ROUNDS);
  const stillListed = summarise189Rounds(rounds189).status !== "none";
  const highest = stillListed && listed.length > 0 ? Math.max(...listed) : null;
  const window = lastRounds(Math.min(CHART_ROUNDS, rounds189.length), "the");
  const tone = (delta: number): Lever["tone"] => (delta < 0 ? "minus" : "plus");
  const add = changes
    .filter((c) => !isDated(c))
    .map((c): Lever => {
      const total = points + c.delta;
      const reaches = highest !== null && points < highest && total >= highest;
      return {
        effect: c.effect,
        tone: tone(c.delta),
        text: reaches
          ? `${c.label}: ${total} points is at or above every cut-off listed in ${window}`
          : c.label,
      };
    });
  const dated = changes.filter(isDated).map((c): Lever => ({
    effect: c.effect,
    tone: tone(c.delta),
    text: `${c.label}, ${formatDate(c.date)}`,
  }));
  return { add, dated };
}
