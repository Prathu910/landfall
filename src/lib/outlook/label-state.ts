import { calendarMonths, splitCoverage } from "../data/months";
import { parseCountText, sumIntervals } from "../data/published-count";
import type {
  Interval,
  MonthKey,
  OccupationCore,
  ScoreCounts,
  StateCode,
  StateVisa,
} from "../data/types";
import { normalizePoolScore } from "../pool";
import type { Group, Outlook, StateOutcome } from "../state-outlook/outlook";
import { LABEL_RANK } from "./labels";
import type { OutlookLabel } from "./labels";

export type StateFlag = "rules-being-checked" | "needs-answers" | null;

export type StateLabel = {
  state: StateCode;
  visa: StateVisa;
  label: OutlookLabel;
  flag: StateFlag;
  /** One line on how the state's rules fit the reader, for the printed appendix. */
  rules: string;
  confirmedAtOrBelow: number; // sum of mins, last 3 months
  monthsAtOrBelow6: number; // months with any invitation at/below, last 6
  latest: { month: MonthKey; count: Interval } | null; // latest month with invitations at/below
};

export type VisaLabel = {
  visa: StateVisa;
  points: number;
  label: OutlookLabel;
  best: StateLabel | null; // null when no state is open to the reader
  states: StateLabel[]; // best first; states not open to the reader last
};

const RECENT_MONTHS = 3;
const WINDOW_MONTHS = 6;
const STRONG_CONFIRMED = 20;
const COMPETITIVE_MASKED_MONTHS = 2;

/** One fetched month of a state's invitations, split at the reader's points. */
type Month = { month: MonthKey; atOrBelow: Interval; total: Interval };

function sumScores(cell: ScoreCounts, include: (score: number) => boolean) {
  return sumIntervals(
    Object.entries(cell)
      .filter(([score]) => include(Number(score)))
      .map(([, text]) => parseCountText(text)),
  );
}

/** Fetched months of the last six, oldest first; unfetched months are left out. */
function fetchedMonths(
  core: OccupationCore,
  visa: StateVisa,
  state: StateCode,
  score: number,
): Month[] {
  const invited = core.stateInvited[visa]?.[state];
  const window = calendarMonths(core.asAt, WINDOW_MONTHS);
  const { covered } = splitCoverage(window, invited);
  return covered.map((month) => {
    const cell = invited?.[month] ?? {};
    return {
      month,
      atOrBelow: sumScores(cell, (s) => s <= score),
      total: sumScores(cell, () => true),
    };
  });
}

function hasAny(count: Interval): boolean {
  return count.max > 0;
}

function ladder(recent: Month[], window: Month[]): OutlookLabel {
  if (window.length === 0) return "no-data";
  const atOrBelow = sumIntervals(recent.map((m) => m.atOrBelow));
  const total = sumIntervals(recent.map((m) => m.total));
  // Cautious half: the fewest invitations at or below against the most overall.
  const halfAtOrBelow = atOrBelow.min * 2 >= total.max;
  if (atOrBelow.min >= STRONG_CONFIRMED && halfAtOrBelow) return "strong";
  if (atOrBelow.min > 0) return "competitive";
  // No month confirms a count here, so any invitation at or below is masked.
  const maskedMonths = recent.filter((m) => hasAny(m.atOrBelow)).length;
  if (maskedMonths >= COMPETITIVE_MASKED_MONTHS) return "competitive";
  // Invitations above the reader's points still show the state invites.
  if (window.some((m) => hasAny(m.total))) return "long-wait";
  return "not-invited";
}

/** The state's label from published invitations alone, before its rules. */
export function evidenceLabel(
  core: OccupationCore,
  visa: StateVisa,
  state: StateCode,
  points: number,
): Omit<StateLabel, "flag" | "rules"> {
  const window = fetchedMonths(core, visa, state, normalizePoolScore(points));
  const recentStart = calendarMonths(core.asAt, RECENT_MONTHS)[0];
  const recent = window.filter((m) => m.month >= recentStart);
  const withInvites = window.filter((m) => hasAny(m.atOrBelow));
  const latest = withInvites.at(-1);
  return {
    state,
    visa,
    label: ladder(recent, window),
    confirmedAtOrBelow: sumIntervals(recent.map((m) => m.atOrBelow)).min,
    monthsAtOrBelow6: withInvites.length,
    latest: latest ? { month: latest.month, count: latest.atOrBelow } : null,
  };
}

const FLAGS: Record<Group, StateFlag> = {
  strongest: null,
  watching: null,
  "needs-answers": "needs-answers",
  unverified: "rules-being-checked",
  "not-open": null,
};

const RULES_BEING_CHECKED = "Rules being checked.";

/** Each question counts once, however many streams ask it. */
function questionCount(outcome: StateOutcome): number {
  const checks = outcome.deciding?.checks ?? [];
  const asked = checks.filter((check) => check.outcome === "needs-answer");
  return new Set(asked.map((check) => check.finding)).size;
}

/** The deciding rule in a line: why a state is closed, or what is still open. */
function rulesNote(outcome: StateOutcome): string {
  if (outcome.group === "unverified") return RULES_BEING_CHECKED;
  if (outcome.group === "needs-answers") {
    const count = questionCount(outcome);
    return count === 1
      ? "1 rule needs your answers."
      : `${count} rules need your answers.`;
  }
  return `${outcome.reasonText}.`;
}

function stateLabel(
  outcome: StateOutcome,
  core: OccupationCore,
  points: number,
): StateLabel {
  const evidence = evidenceLabel(core, outcome.visa, outcome.state, points);
  // The rules decide first: a closed state keeps its evidence numbers only.
  const label = outcome.group === "not-open" ? "not-open" : evidence.label;
  return {
    ...evidence,
    label,
    flag: FLAGS[outcome.group],
    rules: rulesNote(outcome),
  };
}

function rankOf(state: StateLabel): number {
  return LABEL_RANK.indexOf(state.label);
}

/**
 * Best first. A state not open to the reader can never be the best route, so
 * it sorts last even though "not open" outranks "not invited" as a label.
 */
function compareStates(a: StateLabel, b: StateLabel): number {
  const closed =
    Number(a.label === "not-open") - Number(b.label === "not-open");
  if (closed !== 0) return closed;
  const byLabel = rankOf(a) - rankOf(b);
  if (byLabel !== 0) return byLabel;
  const byFlag = Number(a.flag !== null) - Number(b.flag !== null);
  if (byFlag !== 0) return byFlag;
  const byConfirmed = b.confirmedAtOrBelow - a.confirmedAtOrBelow;
  if (byConfirmed !== 0) return byConfirmed;
  const byMonths = b.monthsAtOrBelow6 - a.monthsAtOrBelow6;
  if (byMonths !== 0) return byMonths;
  return a.state < b.state ? -1 : a.state > b.state ? 1 : 0;
}

/**
 * Labels every state for one visa and picks the best route. `points` is the
 * visa's points with nomination, the same points the outlook was built at.
 * The outlook holds the eight states only; "any state" is never ranked.
 */
export function visaLabel(
  outlook: Outlook,
  core: OccupationCore,
  points: number,
): VisaLabel {
  const states = outlook.states
    .map((outcome) => stateLabel(outcome, core, points))
    .sort(compareStates);
  const open = states.filter((s) => s.label !== "not-open");
  const best = open[0] ?? null;
  return {
    visa: outlook.visa,
    points,
    label: best?.label ?? "not-open",
    best,
    states,
  };
}
