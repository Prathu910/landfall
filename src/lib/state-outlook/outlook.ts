import { stateEvidence } from "../data/state-evidence";
import type { StateSide } from "../data/state-evidence";
import type { OccupationCore, StateCode, StateVisa } from "../data/types";
import type { Profile } from "../migration";
import { joinWords, STATE_CODES } from "./context";
import type { Outcome, PointsEligibility, StreamContext } from "./context";
import { evaluateStream, severity } from "./evaluate";
import type { StreamResult } from "./evaluate";
import type { FederalList, ImportedList, StateRules } from "./rules-types";

export type { RuleCheck, StreamResult } from "./evaluate";

export type Group =
  "strongest" | "watching" | "needs-answers" | "unverified" | "not-open";

export type StateOutcome = {
  state: StateCode;
  visa: StateVisa;
  group: Group;
  deciding: StreamResult | null;
  streams: StreamResult[];
  evidence: StateSide;
  reasonText: string;
};

export type Outlook = {
  visa: StateVisa;
  states: StateOutcome[]; // ordered: group order, then evidence peak.min desc, then code
  anyState: StateSide;
  summary: string;
};

export type OutlookInput = {
  core: OccupationCore;
  rules: StateRules;
  lists: Record<string, ImportedList>;
  federal: FederalList | null;
  profile: Profile;
  points: number; // the visa's points with nomination
  eligibility: PointsEligibility;
  visa: StateVisa;
  asOf: string;
};

const GROUP_ORDER: Group[] = [
  "strongest",
  "watching",
  "needs-answers",
  "unverified",
  "not-open",
];

const GROUP_WITHOUT_PASS: Record<Exclude<Outcome, "pass">, Group> = {
  fail: "not-open",
  unverified: "unverified",
  "needs-answer": "needs-answers",
};

function findingsWith(stream: StreamResult, outcome: Outcome): string[] {
  const matching = stream.checks.filter((c) => c.outcome === outcome);
  return [...new Set(matching.map((c) => c.finding))];
}

/** Lower decides first among streams that share the state's best outcome. */
function tiebreak(stream: StreamResult): number {
  const { outcome, checks } = stream;
  // Fewest questions to answer.
  if (outcome === "needs-answer") {
    return findingsWith(stream, "needs-answer").length;
  }
  // The stream whose first failing rule comes latest got furthest.
  if (outcome === "fail") {
    return -checks.findIndex((c) => c.outcome === "fail");
  }
  return 0;
}

/** The state's outcome is its best stream: pass > needs-answer > unverified > fail. */
function decidingStream(streams: StreamResult[]): StreamResult {
  return streams.reduce((best, s) => {
    const diff = severity(s.outcome) - severity(best.outcome);
    if (diff !== 0) return diff < 0 ? s : best;
    return tiebreak(s) < tiebreak(best) ? s : best;
  });
}

function reasonText(deciding: StreamResult): string {
  const { outcome, name } = deciding;
  if (outcome === "pass") return `Meets every verified rule for ${name}`;
  const findings = findingsWith(deciding, outcome);
  if (outcome === "needs-answer") {
    const count = findings.length;
    return `Answer ${count} question${count === 1 ? "" : "s"}: ${joinWords(findings, "and")}`;
  }
  return findings[0];
}

function groupFor(outcome: Outcome, evidence: StateSide): Group {
  if (outcome !== "pass") return GROUP_WITHOUT_PASS[outcome];
  const confirmed = (evidence.peak?.invitedAtLeast.min ?? 0) > 0;
  return confirmed ? "strongest" : "watching";
}

function stateOutcome(
  state: StateCode,
  evidence: StateSide,
  input: OutlookInput,
): StateOutcome {
  const { visa } = input;
  const rules = input.rules.rules.find(
    (r) => r.state === state && r.visa === visa,
  );
  if (rules === undefined || rules.streams.length === 0) {
    return {
      state,
      visa,
      group: "unverified",
      deciding: null,
      streams: [],
      evidence,
      reasonText: `Rules not recorded for ${visa}`,
    };
  }
  const ctx: StreamContext = {
    state,
    visa,
    code: input.core.code,
    profile: input.profile,
    lists: input.lists,
    federal: input.federal,
    asOf: input.asOf,
    programYear: input.rules.programYear.replace("-", "–"),
    points: input.points,
    eligibility: input.eligibility,
  };
  const streams = rules.streams.map((s) => evaluateStream(s, ctx));
  const deciding = decidingStream(streams);
  return {
    state,
    visa,
    group: groupFor(deciding.outcome, evidence),
    deciding,
    streams,
    evidence,
    reasonText: reasonText(deciding),
  };
}

function peakMin(outcome: StateOutcome): number {
  return outcome.evidence.peak?.invitedAtLeast.min ?? 0;
}

function compareOutcomes(a: StateOutcome, b: StateOutcome): number {
  const byGroup = GROUP_ORDER.indexOf(a.group) - GROUP_ORDER.indexOf(b.group);
  if (byGroup !== 0) return byGroup;
  const byPeak = peakMin(b) - peakMin(a);
  if (byPeak !== 0) return byPeak;
  return a.state < b.state ? -1 : a.state > b.state ? 1 : 0;
}

function summary(states: StateOutcome[]): string {
  const strongest = states
    .filter((s) => s.group === "strongest")
    .map((s) => s.state);
  if (strongest.length === 0) {
    return "No state shows strong published evidence for your profile yet.";
  }
  const lead = `Strongest evidence in ${joinWords(strongest, "and")}.`;
  const notOpen = states.filter((s) => s.group === "not-open").length;
  if (notOpen === 0) return lead;
  return `${lead} Not open to you now in ${notOpen} state${notOpen === 1 ? "" : "s"}.`;
}

/**
 * Places each state into an evidence group for one visa. The rules decide
 * whether a state can be open to the user; published invitations only split
 * the passing states. "Any state" invitations never change a group.
 */
export function stateOutlook(input: OutlookInput): Outlook {
  const evidence = STATE_CODES.map((state) =>
    stateEvidence(input.core, input.visa, state, input.points),
  );
  const states = STATE_CODES.map((state, i) =>
    stateOutcome(state, evidence[i].state, input),
  ).sort(compareOutcomes);
  return {
    visa: input.visa,
    states,
    anyState: evidence[0].anyState,
    summary: summary(states),
  };
}
