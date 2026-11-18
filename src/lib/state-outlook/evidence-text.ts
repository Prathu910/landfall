import type { StateSide } from "../data/state-evidence";
import type { MonthlyInvited } from "../data/invitations";
import { formatCount, formatMonth, isMasked } from "../report/copy";
import { STATE_NAMES } from "./context";
import type { StateOutcome } from "./outlook";

// What published SkillSelect invitations and pools say, as tile fragments
// and panel sentences. Never a forecast, and never a masked count as zero.

const MONTHS_SHOWN = 3;

/** Who the evidence is about: one state, or EOIs that name no state. */
export type EvidenceScope = "state" | "any-state";

const SCOPE_WORDS: Record<EvidenceScope, string> = {
  state: "this state",
  "any-state": "EOIs not tied to one state",
};

function noPublishedInvitations(scope: EvidenceScope): string {
  return `no published invitation data for ${SCOPE_WORDS[scope]} in the last 12 months`;
}

function capitalise(text: string): string {
  return `${text[0].toUpperCase()}${text.slice(1)}`;
}

/** "at least 14 invited at ≤95 (as at Sep 2026)" for a confirmed peak. */
function peakFragment(peak: MonthlyInvited, points: number): string {
  const count = formatCount({
    min: peak.invitedAtLeast.min,
    max: peak.invitedAtLeast.min,
  });
  return `at least ${count} invited at ≤${points} (as at ${formatMonth(peak.asAt)})`;
}

/** What published invitations say at or below the score, for a tile. */
export function evidenceFragment(
  side: StateSide,
  points: number,
  scope: EvidenceScope,
): string {
  if (side.peak !== null) return peakFragment(side.peak, points);
  if (side.invitedAtOrBelow.length === 0) {
    return noPublishedInvitations(scope);
  }
  if (side.invitedAtOrBelow.some((m) => isMasked(m.invitedAtLeast))) {
    return "under 20 invited, so may be zero";
  }
  return "no invitations recorded at your score in 12 months";
}

/** The newest snapshot month the side covers, which the pool counts are as at. */
function snapshotMonth(side: StateSide): string | null {
  const months = [
    ...side.invitedAtOrBelow.map((m) => m.asAt),
    ...side.notPublished,
  ];
  return months.length === 0 ? null : months.reduce((a, b) => (a > b ? a : b));
}

function monthlySentence(month: MonthlyInvited, points: number): string {
  const when = `(as at ${formatMonth(month.asAt)})`;
  const where = `at ${points} points or below`;
  const count = month.invitedAtLeast;
  if (isMasked(count))
    return `Under 20 invited ${where}, so may be zero ${when}`;
  if (count.min === 0) return `No invitations recorded ${where} ${when}`;
  return `At least ${formatCount({ min: count.min, max: count.min })} invited ${where} ${when}`;
}

function competitorSentence(
  outcome: StateOutcome,
  points: number,
  snapshot: string,
): string {
  const count = outcome.evidence.competitorsAtOrAbove;
  if (count === null)
    return "No published count of competing EOIs for this state";
  const state = STATE_NAMES[outcome.state];
  const when = `(as at ${formatMonth(snapshot)})`;
  const tail = `EOIs for the ${outcome.visa} visa that name ${state} and have ${points} points or more ${when}`;
  if (isMasked(count)) return `Published as under 20: ${tail}`;
  return `${formatCount(count)} EOIs for the ${outcome.visa} visa name ${state} and have ${points} points or more ${when}`;
}

function scoreRangeSentence(
  range: { min: number; max: number },
  snapshot: string,
): string {
  const where =
    range.min === range.max
      ? `at ${range.min} points`
      : `between ${range.min} and ${range.max} points`;
  return `Published invitations in the last 12 months were ${where} (as at ${formatMonth(snapshot)})`;
}

function peakSentence(peak: MonthlyInvited, points: number): string {
  const count = formatCount({
    min: peak.invitedAtLeast.min,
    max: peak.invitedAtLeast.min,
  });
  return `Highest month: at least ${count} invited at ${points} points or below (${formatMonth(peak.asAt)})`;
}

/** The panel's "What the data shows" sentences for one state. */
export function dataSentences(outcome: StateOutcome, points: number): string[] {
  const side = outcome.evidence;
  const snapshot = snapshotMonth(side);
  const sentences: string[] = [];
  if (snapshot !== null) {
    sentences.push(competitorSentence(outcome, points, snapshot));
  }
  const shown = side.invitedAtOrBelow.slice(-MONTHS_SHOWN).reverse();
  if (side.invitedAtOrBelow.length === 0) {
    sentences.push(capitalise(noPublishedInvitations("state")));
  }
  for (const month of shown) sentences.push(monthlySentence(month, points));
  const peak = side.peak;
  if (peak !== null && !shown.some((m) => m.asAt === peak.asAt)) {
    sentences.push(peakSentence(peak, points));
  }
  if (side.scoreRange !== null && snapshot !== null) {
    sentences.push(scoreRangeSentence(side.scoreRange, snapshot));
  }
  if (side.notPublished.length > 0 && snapshot !== null) {
    sentences.push(
      `No published data for ${side.notPublished.map(formatMonth).join(", ")} (as at ${formatMonth(snapshot)})`,
    );
  }
  return sentences;
}
