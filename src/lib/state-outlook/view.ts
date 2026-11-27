import type { StateSide } from "../data/state-evidence";
import type { StateCode, StateVisa } from "../data/types";
import { STATE_NAMES } from "./context";
import {
  dataSentences,
  evidenceFragment,
  evidenceLead,
  type EvidenceLead,
} from "./evidence-text";
import type { Group, Outlook, StateOutcome } from "./outlook";
import { canApplyLines } from "./panel-lines";
import type { CanApplyLine } from "./panel-lines";
import type { StateVisaRules } from "./rules-types";

export type { CanApplyLine } from "./panel-lines";

export type Tile = {
  state: StateCode;
  group: Group;
  label: string;
  /** The tile's line in one sentence: a closed door's reason, or the evidence. */
  fragment: string;
  /** The evidence split for display, headline first; null for a closed door. */
  lead: EvidenceLead | null;
  href: string; // "#state-<visa>-<code>"
};

export type StatePanel = {
  id: string;
  heading: string;
  groupLabel: string;
  // The stream that decided the state's group; null when no stream decides,
  // as when every stream is closed to the user and the lines say why.
  streamName: string | null;
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
  // Our check of the official rules, not the user: see ruling in STRATEGY (19 Nov 2026).
  unverified: "Rules being checked",
  "not-open": "Not open to you now",
};

/** Builder-only: also a bundle-lock sentinel (report-issue/sentinels.ts). */
export const STATE_PANEL_FOOTER =
  "Not advice to apply. Rules change; check the official page.";
const ANY_STATE_NOTE =
  "EOIs not tied to one state; not counted in any state's group";

function panelId(visa: StateVisa, state: StateCode): string {
  return `state-${visa}-${state}`;
}

function fragmentFor(outcome: StateOutcome, points: number): string {
  // Only a closed door shows its reason; the reasons for the rest sit in the panels.
  if (outcome.group === "not-open") return outcome.reasonText;
  return evidenceFragment(outcome.evidence, points, "state");
}

/** Tiles in the outlook's order; `points` is the score the evidence is read at. */
export function buildTiles(outlook: Outlook, points: number): Tile[] {
  return outlook.states.map((outcome) => ({
    state: outcome.state,
    group: outcome.group,
    label: STATE_NAMES[outcome.state],
    fragment: fragmentFor(outcome, points),
    lead:
      outcome.group === "not-open"
        ? null
        : evidenceLead(outcome.evidence, points),
    href: `#${panelId(outcome.visa, outcome.state)}`,
  }));
}

export function buildAnyStateTile(
  anyState: StateSide,
  points: number,
): { label: string; fragment: string; note: string } {
  return {
    label: "Any state",
    fragment: evidenceFragment(anyState, points, "any-state"),
    note: ANY_STATE_NOTE,
  };
}

function pointsLines(
  outcome: StateOutcome,
  rules: StateVisaRules | undefined,
  points: number,
): string[] {
  const lines = [`${points} federal points with nomination`];
  const system = rules?.ownScoreSystem?.value.name;
  if (system !== undefined) {
    lines.push(
      `${STATE_NAMES[outcome.state]} ranks with its own ${system}, which is not calculated here.`,
    );
  }
  return lines;
}

/** Everything one state's detail panel shows, as plain strings; `rules` is undefined when none are recorded. */
export function buildStatePanel(
  outcome: StateOutcome,
  rules: StateVisaRules | undefined,
  points: number,
  asOf: string,
): StatePanel {
  const name = STATE_NAMES[outcome.state];
  return {
    id: panelId(outcome.visa, outcome.state),
    heading: `${name} · ${outcome.visa}`,
    groupLabel: GROUP_LABELS[outcome.group],
    streamName:
      outcome.group === "not-open" ? null : (outcome.deciding?.name ?? null),
    canApply: canApplyLines(outcome, rules, asOf),
    data: dataSentences(outcome, points),
    pointsThere: pointsLines(outcome, rules, points),
    resultsLink:
      rules?.resultsUrl === undefined
        ? null
        : {
            href: rules.resultsUrl,
            text: `${name} published results (past results, not a prediction)`,
          },
    footer: STATE_PANEL_FOOTER,
  };
}
