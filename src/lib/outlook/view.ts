import type {
  Interval,
  OccupationCore,
  OccupationDetail,
  StateCode,
  StateVisa,
  Visa,
} from "../data/types";
import { calculatePoints, formatDate } from "../migration";
import type { PointsResult } from "../migration";
import { formatCount } from "../report/copy";
import { STATE_NAMES } from "../state-outlook/context";
import { cutoffColumns } from "./charts";
import type { CutoffColumns } from "./charts";
import { evaluateProfile } from "./evaluate-profile";
import type { OutlookInput, ProfileOutlook } from "./evaluate-profile";
import { buildFacts, lastListedMonth } from "./facts";
import { buildHeadline } from "./headline";
import type { Headline } from "./headline";
import { capital } from "./headline-context";
import { buildImprove } from "./improve";
import type { Improve } from "./improve";
import { MIN_POINTS } from "./label-189";
import type { StateLabel } from "./label-state";
import { stampName } from "./labels";
import type { OutlookLabel } from "./labels";
import {
  dataMonth,
  flagNote,
  isLodged,
  joinAnd,
  longMonth,
  namedState,
  occupationName,
  stateVisaOf,
  stateWhy,
  theState,
  theStateName,
  withoutConfirm,
} from "./phrases";
import { queueView } from "./queue-view";
import type { QueueView } from "./queue-view";
import type { ReportFacts } from "./read-contract";
import { readTemplate } from "./read-template";
import { buildRoute, daysBetween } from "./route";
import type { Route } from "./route";
import type { Stamp } from "./stamp";
import { estimatedWait, roughly } from "./wait";
import type { EstimatedWait } from "./wait";

export type OccupationState =
  | { status: "loading" }
  | { status: "ready"; core: OccupationCore; detail: OccupationDetail | null }
  | { status: "unavailable" }; // report.tsx converts ReportOccupation to this

export type VisaCard = {
  visa: Visa;
  shape: "rect" | "hex" | "oval";
  top: string;
  stampWord: string;
  points: number;
  label: OutlookLabel;
  title: string;
  caption: string;
  flagText: string | null;
};

export type OutlookView =
  | { kind: "loading" }
  | { kind: "points-only"; points: PointsResult; line: string }
  | {
      kind: "report";
      headline: Headline;
      /** "{occupation}, {points} points, {where}. Data to {Month YYYY}." */
      whoDetail: string;
      stamp: Stamp;
      stampRing: string;
      stampBottom: string;
      wait: string;
      visas: VisaCard[];
      cutoffs: CutoffColumns | null;
      cutoffsEmpty: string | null;
      queue: QueueView | null;
      queueEmpty: string | null;
      route: Route;
      improve: Improve;
      /** False in plain mode: its moves and losses carry no-data labels the UI must not show. */
      improveLabels: boolean;
      facts: ReportFacts;
      templateRead: string;
      points: PointsResult;
      methodLines: string[];
      footer: string;
      dataMonth: string;
    };

export type OutlookViewInput = Omit<OutlookInput, "core" | "detail"> & {
  occupation: OccupationState;
};

const POINTS_ONLY_LINE = "Choose an occupation to see how your points compare.";
const COMBINED_RING = "189 • 190 • 491";
const ANY_STATE = "ANY STATE";
const SHAPES: Record<Visa, VisaCard["shape"]> = {
  "189": "rect",
  "190": "hex",
  "491": "oval",
};
const TITLES: Record<Visa, string> = {
  "189": "189 Independent",
  "190": "190 Nominated",
  "491": "491 Regional",
};
const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

// The mockup's "How we label your outlook" bullets (spec 6.2 to 6.4).
export const METHOD_LINES: readonly string[] = [
  "Very strong: your points are above every 189 cut-off in your occupation's last 3 listed rounds, and fewer than 20 EOIs score higher.",
  "Strong: your points meet every cut-off in those 3 rounds.",
  "Competitive: your points meet the lowest of those 3 cut-offs, but not all of them.",
  "Long wait: your occupation is still listed, but your points are below all 3 cut-offs.",
  "Not currently invited: your occupation wasn't listed in any of the last 4 rounds.",
  "Not eligible yet: under 65 points, or a basic requirement isn't met.",
  "190 and 491: each state is labelled from its invitations at or below your points (with nomination) over the last 3 to 6 months, and its rules. The visa takes its best state.",
  "The stamp shows your best visa. If none is Competitive or better, it covers all three.",
];

function footerText(month: string): string {
  return (
    "This is our best reading of the data, not a guarantee. " +
    `It comes from published SkillSelect figures up to ${month}. ` +
    "Home Affairs and the states can change round sizes, cut-offs and rules at any time, so your real result may be different. " +
    "MigrateLens isn't a registered migration agent; for advice on your own case, talk to one."
  );
}

function plural(count: number, unit: string): string {
  return `${count} ${count === 1 ? unit : `${unit}s`}`;
}

function aheadOfYou(ahead: Interval): string {
  if (ahead.max === 0) return "No EOIs ahead of you.";
  return `${capital(formatCount(ahead))} EOIs ahead of you.`;
}

// A pool that isn't being invited has no queue, only higher scores.
function scoreHigher(ahead: Interval): string {
  if (ahead.max === 0) return "No EOIs score higher.";
  return `${capital(formatCount(ahead))} EOIs score higher.`;
}

/** Days since the EOI was submitted; null without a date or for a future one. */
function daysWaiting(input: OutlookInput): number | null {
  const { eoiDate } = input.profile;
  if (!ISO_DATE.test(eoiDate) || eoiDate > input.asOf) return null;
  const days = daysBetween(eoiDate, input.asOf);
  return Number.isFinite(days) ? days : null;
}

function caption189(
  input: OutlookInput,
  o: ProfileOutlook,
  wait: EstimatedWait,
): string {
  const { v189, points } = o;
  if (v189.label === "not-eligible") {
    return points.eligible === false
      ? v189.why
      : `You need ${MIN_POINTS - points.base} more points.`;
  }
  if (v189.label === "no-data") {
    return v189.tooFew
      ? "Every published 189 count is under 20."
      : "No published pool or rounds.";
  }
  if (v189.label === "not-invited") {
    const last = lastListedMonth(input);
    const since = last
      ? `Not listed since ${last}.`
      : "Not listed in any published round.";
    return v189.ahead ? `${since} ${scoreHigher(v189.ahead)}` : since;
  }
  const days = daysWaiting(input);
  if (days !== null) {
    const waiting = `Waiting ${plural(days, "day")}.`;
    if (wait.pace) {
      return `${waiting} Roughly ${roughly(wait.pace.ahead)} EOIs ahead.`;
    }
    return v189.ahead ? `${waiting} ${scoreHigher(v189.ahead)}` : waiting;
  }
  return v189.ahead ? aheadOfYou(v189.ahead) : withoutConfirm(v189.why);
}

function card189(
  input: OutlookInput,
  o: ProfileOutlook,
  wait: EstimatedWait,
): VisaCard {
  const { v189 } = o;
  return {
    visa: "189",
    shape: SHAPES["189"],
    top: `189 ${ANY_STATE}`,
    stampWord: stampName(v189.label, v189.tooFew),
    points: o.points.base,
    label: v189.label,
    title: TITLES["189"],
    caption: caption189(input, o, wait),
    flagText: null,
  };
}

type StateCardText = Pick<VisaCard, "top" | "stampWord" | "caption">;

function invitedCaption(state: StateLabel): string {
  if (!state.latest) return `${capital(stateWhy(state))}.`;
  const { count, month } = state.latest;
  return `${capital(theState(state.state))} invited ${formatCount(count)} EOIs at or below your points in ${longMonth(month)}.`;
}

/** States whose lists hold the occupation, when there is no evidence to label it. */
function listedBy(
  o: ProfileOutlook,
  visa: StateVisa,
  label: OutlookLabel,
): StateCode[] {
  const federal = visa === "190" ? "federal190" : "federal491";
  if (label !== "no-data" || !o.listMembership[federal]) return [];
  return o.listMembership.states;
}

/** Ruling R16: a state named from its list says so ("On WA list"). */
function listText(visa: StateVisa, states: StateCode[]): StateCardText {
  const one = states.length === 1;
  const names = joinAnd(states.map((s) => theStateName(STATE_NAMES[s])));
  const regional = one
    ? `Check ${names}'s regional program.`
    : `Check the regional programs of ${names}.`;
  return {
    top: one ? `${visa} ${states[0]}` : `${visa} ${ANY_STATE}`,
    stampWord: one ? `On ${states[0]} list` : `On ${states.length} state lists`,
    caption: visa === "190" ? `Listed by ${names}.` : capital(regional),
  };
}

function unnamedCaption(input: OutlookInput, label: OutlookLabel): string {
  if (label === "not-open") return "No state's rules fit your answers.";
  if (label === "not-invited") {
    return "No state open to you invited your occupation in the last 6 months.";
  }
  return input.core
    ? "No state has published invitation data for the last 6 months."
    : "No state invitations are published for your occupation.";
}

function stateCard(
  input: OutlookInput,
  o: ProfileOutlook,
  visa: StateVisa,
): VisaCard {
  const visaLabel = stateVisaOf(o, visa);
  const label = visaLabel?.label ?? "no-data";
  // Ruling R7: only a state with invitation evidence is named.
  const named = namedState(visaLabel);
  const listed = listedBy(o, visa, label);
  let text: StateCardText;
  if (named) {
    text = {
      top: `${visa} ${named.state}`,
      stampWord: stampName(label),
      caption: invitedCaption(named),
    };
  } else if (listed.length > 0) {
    text = listText(visa, listed);
  } else {
    text = {
      top: `${visa} ${ANY_STATE}`,
      stampWord: stampName(label),
      caption: unnamedCaption(input, label),
    };
  }
  return {
    visa,
    shape: SHAPES[visa],
    ...text,
    points: visa === "190" ? o.points.subclass190 : o.points.subclass491,
    label,
    title: TITLES[visa],
    flagText: named ? flagNote(named) : null,
  };
}

function stampRing(stamp: Stamp): string {
  if (stamp.kind === "combined") return COMBINED_RING;
  const state = stamp.state ? ` ${stamp.state}` : "";
  return `SUBCLASS ${stamp.visa}${state}`;
}

/** "OCT 2026 • 85 POINTS": the snapshot month and the stamped visa's points. */
function stampBottom(o: ProfileOutlook, month: string): string {
  const [name, year] = month.split(" ");
  const points = o.stamp.kind === "single" ? o.stamp.points : o.points.base;
  return `${name.slice(0, 3).toUpperCase()} ${year} • ${points} POINTS`;
}

function whoDetail(input: OutlookInput, o: ProfileOutlook): string {
  const { profile } = input;
  const where = profile.onshore
    ? `onshore${profile.state ? ` in ${profile.state}` : ""}`
    : "offshore";
  const submitted = isLodged(input)
    ? ` EOI submitted ${formatDate(profile.eoiDate)}.`
    : "";
  return `${occupationName(input)}, ${o.points.base} points, ${where}.${submitted} Data to ${dataMonth(input)}.`;
}

function reportView(input: OutlookInput): OutlookView {
  const o = evaluateProfile(input);
  const improve = buildImprove(input, o);
  const wait = estimatedWait(o, input);
  const route = buildRoute(input, o, improve);
  const facts = buildFacts(input, o, wait.text, improve, route);
  const month = dataMonth(input);
  const name = occupationName(input);
  const base = o.points.base;
  const cutoffs = cutoffColumns(input.core, base, improve);
  const closed = o.v189.label === "not-invited";
  const queue = queueView(
    input.core,
    input.detail,
    base,
    input.profile.eoiDate,
    closed,
  );
  return {
    kind: "report",
    headline: buildHeadline(input, o, improve),
    whoDetail: whoDetail(input, o),
    stamp: o.stamp,
    stampRing: stampRing(o.stamp),
    stampBottom: stampBottom(o, month),
    wait: wait.text,
    visas: [
      card189(input, o, wait),
      stateCard(input, o, "190"),
      stateCard(input, o, "491"),
    ],
    cutoffs,
    cutoffsEmpty: cutoffs
      ? null
      : `No 189 round in the published results lists ${name}, so there are no cut-offs to show.`,
    queue,
    queueEmpty: queue
      ? null
      : `SkillSelect hasn't published any 189 EOI counts for ${name}, so there's no queue to show.`,
    route,
    improve,
    improveLabels: improve.mode !== "plain",
    facts,
    templateRead: readTemplate(facts),
    points: o.points,
    methodLines: [...METHOD_LINES],
    footer: footerText(month),
    dataMonth: month,
  };
}

export function buildOutlookView(input: OutlookViewInput): OutlookView {
  const { occupation, ...rest } = input;
  if (rest.profile.occupation === "") {
    const points = calculatePoints(rest.profile, rest.asOf);
    return { kind: "points-only", points, line: POINTS_ONLY_LINE };
  }
  if (occupation.status === "loading") return { kind: "loading" };
  // A failed load takes the no-core path, like an occupation with no data.
  const ready = occupation.status === "ready";
  return reportView({
    ...rest,
    core: ready ? occupation.core : null,
    detail: ready ? occupation.detail : null,
  });
}
