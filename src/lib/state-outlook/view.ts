import type { StateSide } from "../data/state-evidence";
import type { MonthlyInvited } from "../data/invitations";
import type { StateCode, StateVisa } from "../data/types";
import { formatDate } from "../migration";
import { formatCount, formatMonth, isMasked } from "../report/copy";
import { STATE_NAMES } from "./context";
import type { Group, Outlook, StateOutcome } from "./outlook";
import type { RuleCheck } from "./judge";
import type { StateVisaRules } from "./rules-types";
import { isStale } from "./staleness";

export type Tile = {
  state: StateCode;
  group: Group;
  label: string;
  fragment: string;
  href: string; // "#state-<visa>-<code>"
};

export type CanApplyLine = {
  text: string;
  mark: "✓" | "✗" | "?";
  source?: string; // omitted when the line has no page to link
  checkedNote: string;
};

export type StatePanel = {
  id: string;
  heading: string;
  groupLabel: string;
  streamName: string | null; // the stream that decided the state's group
  canApply: CanApplyLine[];
  data: string[];
  pointsThere: string[];
  resultsLink: { href: string; text: string } | null;
  footer: string;
};

const GROUP_LABELS: Record<Group, string> = {
  strongest: "Strongest evidence",
  watching: "Worth watching",
  "needs-answers": "Needs your answers",
  unverified: "Not yet verified",
  "not-open": "Not open to you now",
};

const MARKS: Record<RuleCheck["outcome"], CanApplyLine["mark"]> = {
  pass: "✓",
  fail: "✗",
  "needs-answer": "?",
  unverified: "?",
};

const FOOTER = "Not advice to apply. Rules change; check the official page.";
const NOT_VERIFIED = "Not yet verified on the official page";
const PROGRAM_YEAR = "2026–27";
const ANY_STATE_NOTE =
  "EOIs not tied to one state; not counted in any state's group";
const MONTHS_SHOWN = 3;
const NO_PUBLISHED_INVITATIONS =
  "no published invitation data for this state in the last 12 months";

function panelId(visa: StateVisa, state: StateCode): string {
  return `state-${visa}-${state}`;
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
function evidenceFragment(side: StateSide, points: number): string {
  if (side.peak !== null) return peakFragment(side.peak, points);
  if (side.invitedAtOrBelow.length === 0) return NO_PUBLISHED_INVITATIONS;
  if (side.invitedAtOrBelow.some((m) => isMasked(m.invitedAtLeast))) {
    return "under 20 invited, so may be zero";
  }
  return "no invitations recorded at your score in 12 months";
}

function fragmentFor(outcome: StateOutcome, points: number): string {
  // Only a closed door shows its reason; the reasons for the rest sit in the panels.
  if (outcome.group === "not-open") return outcome.reasonText;
  return evidenceFragment(outcome.evidence, points);
}

/** Tiles in the outlook's order; `points` is the score the evidence is read at. */
export function buildTiles(outlook: Outlook, points: number): Tile[] {
  return outlook.states.map((outcome) => ({
    state: outcome.state,
    group: outcome.group,
    label: STATE_NAMES[outcome.state],
    fragment: fragmentFor(outcome, points),
    href: `#${panelId(outcome.visa, outcome.state)}`,
  }));
}

export function buildAnyStateTile(
  anyState: StateSide,
  points: number,
): { label: string; fragment: string; note: string } {
  return {
    label: "Any state",
    fragment: evidenceFragment(anyState, points),
    note: ANY_STATE_NOTE,
  };
}

/** One wording for how fresh a rule is; stale wins over unverified. */
function checkedNote(
  checkedAt: string,
  stale: boolean,
  unverified: boolean,
): string {
  if (stale) return `Last checked ${formatDate(checkedAt)}; may have changed`;
  if (unverified) return NOT_VERIFIED;
  return `checked ${formatDate(checkedAt)}`;
}

/** A link only when there is a page to point to. */
function withSource(source: string): { source?: string } {
  return source === "" ? {} : { source };
}

function checkLine(check: RuleCheck): CanApplyLine {
  return {
    text:
      check.outcome === "needs-answer" && check.question
        ? check.question
        : check.label,
    mark: MARKS[check.outcome],
    ...withSource(check.source),
    checkedNote: checkedNote(
      check.checkedAt,
      check.stale,
      check.outcome === "unverified",
    ),
  };
}

function canApplyLines(
  outcome: StateOutcome,
  rules: StateVisaRules,
  asOf: string,
): CanApplyLine[] {
  const deciding = outcome.deciding;
  if (deciding === null) {
    return [{ text: outcome.reasonText, mark: "?", checkedNote: NOT_VERIFIED }];
  }
  const stream = rules.streams.find((s) => s.id === deciding.streamId);
  const lines: CanApplyLine[] = [];
  let checks = deciding.checks;
  // A secondary closure is never decisive, so say it before anything else and
  // drop the stream's own (duplicate) status check.
  if (
    stream?.status.value === "closed" &&
    stream.status.verification === "secondary"
  ) {
    lines.push({
      text: `Reported closed for ${outcome.visa} in ${PROGRAM_YEAR}, not yet verified on the official page`,
      mark: "?",
      source: stream.status.source,
      checkedNote: NOT_VERIFIED,
    });
    checks = checks.filter((c) => c.label !== `Closed in ${PROGRAM_YEAR}`);
  }
  lines.push(...checks.map(checkLine));
  const restriction = stream?.restriction;
  if (restriction !== undefined) {
    lines.push({
      text: `Restriction, not checked here: ${restriction.value.replace(/[.\s]+$/, "")}`,
      mark: "?",
      ...withSource(restriction.source),
      checkedNote: checkedNote(
        restriction.checkedAt,
        isStale(restriction.checkedAt, asOf),
        restriction.verification === "secondary",
      ),
    });
  }
  return lines;
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

function dataSentences(outcome: StateOutcome, points: number): string[] {
  const side = outcome.evidence;
  const snapshot = snapshotMonth(side);
  const sentences: string[] = [];
  if (snapshot !== null) {
    sentences.push(competitorSentence(outcome, points, snapshot));
  }
  const shown = side.invitedAtOrBelow.slice(-MONTHS_SHOWN).reverse();
  if (side.invitedAtOrBelow.length === 0) {
    sentences.push(capitalise(NO_PUBLISHED_INVITATIONS));
  }
  for (const month of shown) sentences.push(monthlySentence(month, points));
  const peak = side.peak;
  if (peak !== null && !shown.some((m) => m.asAt === peak.asAt)) {
    const count = formatCount({
      min: peak.invitedAtLeast.min,
      max: peak.invitedAtLeast.min,
    });
    sentences.push(
      `Highest month: at least ${count} invited at ${points} points or below (${formatMonth(peak.asAt)})`,
    );
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

function pointsLines(
  outcome: StateOutcome,
  rules: StateVisaRules,
  points: number,
): string[] {
  const lines = [`${points} federal points with nomination`];
  const system = rules.ownScoreSystem?.value.name;
  if (system !== undefined) {
    lines.push(
      `${STATE_NAMES[outcome.state]} ranks with its own ${system}, which is not calculated here.`,
    );
  }
  return lines;
}

/** Everything one state's detail panel shows, as plain strings. */
export function buildStatePanel(
  outcome: StateOutcome,
  rules: StateVisaRules,
  points: number,
  asOf: string,
): StatePanel {
  const name = STATE_NAMES[outcome.state];
  return {
    id: panelId(outcome.visa, outcome.state),
    heading: `${name} · ${outcome.visa}`,
    groupLabel: GROUP_LABELS[outcome.group],
    streamName: outcome.deciding?.name ?? null,
    canApply: canApplyLines(outcome, rules, asOf),
    data: dataSentences(outcome, points),
    pointsThere: pointsLines(outcome, rules, points),
    resultsLink:
      rules.resultsUrl === undefined
        ? null
        : {
            href: rules.resultsUrl,
            text: `${name} published results (past results, not a prediction)`,
          },
    footer: FOOTER,
  };
}
