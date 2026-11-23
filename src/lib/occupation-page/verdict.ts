import type { OccupationCore } from "../data/types";
import {
  MIN_POINTS,
  NOT_AVAILABLE,
  label189,
  stateVisasOnList,
} from "../outlook/label-189";
import { labelName } from "../outlook/labels";
import type { OutlookLabel } from "../outlook/labels";
import type { FederalList } from "../state-outlook/rules-types";

type FederalEntry = FederalList["entries"][string];

/**
 * The 189 label at a few scores, by the report's own rules (label-189.ts),
 * for the strip near the top of each occupation page. An occupation the
 * federal list doesn't have for 189 gets one line instead.
 */

export type VerdictCell = { points: string; label: OutlookLabel; name: string };

export type OccupationVerdict =
  | { kind: "scores"; cells: VerdictCell[]; note: string; checkHref: string }
  | {
      kind: "closed";
      label: OutlookLabel;
      name: string;
      text: string;
      checkHref: string;
    }
  | { kind: "unavailable"; name: string; text: string; checkHref: string };

const STEP = 5;
/** The strip shows at least 65 to 90, the scores most readers hold. */
const MIN_TOP = 90;

type Run = { from: number; to: number; label: OutlookLabel };

function labelAt(core: OccupationCore, points: number) {
  return label189({ points, eligible: true, core });
}

/**
 * Every 5 points from 65 to 90, or to 5 above the highest recent cut-off,
 * so the score where the best label starts is always shown.
 */
function scoresFor(lastThree: number[]): number[] {
  const highest = Math.max(MIN_POINTS, ...lastThree);
  const top = Math.max(MIN_TOP, Math.ceil(highest / STEP) * STEP + STEP);
  const scores: number[] = [];
  for (let points = MIN_POINTS; points <= top; points += STEP) {
    scores.push(points);
  }
  return scores;
}

/** Consecutive scores that share a label become one run. */
function runsOf(core: OccupationCore, scores: number[]): Run[] {
  const runs: Run[] = [];
  for (const points of scores) {
    const { label } = labelAt(core, points);
    const last = runs.at(-1);
    if (last && last.label === label) last.to = points;
    else runs.push({ from: points, to: points, label });
  }
  return runs;
}

/** "65", "70–75", or "85+" for a very strong top run (no higher label exists). */
function pointsText(run: Run, isLast: boolean): string {
  if (isLast && run.label === "very-strong") return `${run.from}+`;
  return run.from === run.to ? `${run.from}` : `${run.from}–${run.to}`;
}

function joinCutoffs(values: number[]): string {
  if (values.length < 2) return values.join("");
  return `${values.slice(0, -1).join(", ")} and ${values.at(-1)}`;
}

function noteOf(lastThree: number[]): string {
  const rounds =
    lastThree.length === 1
      ? "the last listed 189 round (cut-off"
      : `the last ${lastThree.length} listed 189 rounds (cut-offs`;
  return `Assumes you meet the points-test basics (age, English and skills assessment). Based on ${rounds} ${joinCutoffs(lastThree)}). Not a guarantee.`;
}

function closedText(label: OutlookLabel, tooFew: boolean): string {
  if (label === "not-invited") {
    return "189 hasn't listed this occupation in the last 4 rounds, so a higher score doesn't change this.";
  }
  return tooFew
    ? "Every published 189 count for this occupation is under 20 (so may be zero): too few to read at any score."
    : "No published 189 pool or invitation round lists this occupation, so there is no 189 outlook to show at any score.";
}

function unavailableText(entry: FederalEntry | undefined) {
  const visas = stateVisasOnList({
    federal190: entry?.["190"] === true,
    federal491: entry?.["491"] === true,
  }).join(" and ");
  const lead = visas
    ? `189 isn't available for this occupation; ${visas} may be, with state or territory nomination.`
    : "189 isn't available for this occupation, and nor are 190 and 491.";
  return `${lead} The Home Affairs skilled occupation list doesn't include it for 189, so a higher score doesn't change this.`;
}

/**
 * The federal list decides 189 eligibility (a missing code is not on it). With
 * no readable list, the published 189 data alone decides the verdict.
 */
export function occupationVerdict(
  core: OccupationCore,
  federal: FederalList | null,
): OccupationVerdict {
  const checkHref = `/check/?occupation=${core.code}`;
  const entry = federal?.entries[core.code];
  if (federal && !entry?.["189"]) {
    return {
      kind: "unavailable",
      name: NOT_AVAILABLE,
      text: unavailableText(entry),
      checkHref,
    };
  }
  const atPassMark = labelAt(core, MIN_POINTS);
  // Not invited or no data at 65 stays so at every score (label-189.ts).
  if (atPassMark.label === "not-invited" || atPassMark.label === "no-data") {
    return {
      kind: "closed",
      label: atPassMark.label,
      name: labelName(atPassMark.label, atPassMark.tooFew),
      text: closedText(atPassMark.label, atPassMark.tooFew),
      checkHref,
    };
  }
  const runs = runsOf(core, scoresFor(atPassMark.lastThree));
  const cells = runs.map((run, i) => ({
    points: pointsText(run, i === runs.length - 1),
    label: run.label,
    name: labelName(run.label),
  }));
  return {
    kind: "scores",
    cells,
    note: noteOf(atPassMark.lastThree),
    checkHref,
  };
}
