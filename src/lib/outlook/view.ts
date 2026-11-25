import type { OccupationCore, OccupationDetail } from "../data/types";
import { calculatePoints, formatDate } from "../migration";
import type { PointsResult } from "../migration";
import { formatMonth } from "../report/copy";
import { cutoffColumns } from "./charts";
import type { CutoffColumns } from "./charts";
import { evaluateProfile } from "./evaluate-profile";
import type { OutlookInput, ProfileOutlook } from "./evaluate-profile";
import { eoiExpiry } from "./eoi-expiry";
import { buildEvidence } from "./evidence";
import type { Evidence } from "./evidence";
import { buildFacts } from "./facts";
import { buildHeadline } from "./headline";
import type { Headline } from "./headline";
import { buildImprove } from "./improve";
import type { Improve } from "./improve";
import { METHOD_LINES } from "./method";
import { dataMonth, dataMonthKey, isLodged, occupationName } from "./phrases";
import { buildPointsPage } from "./points-page";
import type { PointsPage } from "./points-page";
import { queueView } from "./queue-view";
import type { QueueView } from "./queue-view";
import type { ReportFacts } from "./read-contract";
import { readTemplate } from "./read-template";
import { buildRoute } from "./route";
import type { Route } from "./route";
import type { Stamp } from "./stamp";
import { visaCards } from "./visa-cards";
import type { VisaCard } from "./visa-cards";
import { estimatedWait } from "./wait";

export type { VisaCard } from "./visa-cards";

export type OccupationState =
  | { status: "loading" }
  | { status: "ready"; core: OccupationCore; detail: OccupationDetail | null }
  /** Left the SkillSelect data: only its note and the points are shown. */
  | { status: "dropped"; note: string }
  | { status: "unavailable" } // no published data: the no-core report
  /** The published file failed to load: a network fact, never a data fact. */
  | { status: "load-failed" }; // report.tsx converts ReportOccupation to this

export type OutlookView =
  | { kind: "loading" }
  | {
      kind: "points-only";
      points: PointsResult;
      line: string;
      pointsPage: PointsPage;
      footer: string;
      dataMonth: string;
    }
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
      /** False in plain and off-list modes: their losses carry labels that mean nothing there. */
      improveLabels: boolean;
      facts: ReportFacts;
      templateRead: string;
      points: PointsResult;
      pointsPage: PointsPage;
      evidence: Evidence;
      methodLines: string[];
      footer: string;
      dataMonth: string;
    };

/** The full report, once the occupation has loaded (or has no data). */
export type ReportOutlookView = Extract<OutlookView, { kind: "report" }>;

export type OutlookViewInput = Omit<OutlookInput, "core" | "detail"> & {
  occupation: OccupationState;
};

const POINTS_ONLY_LINE = "Choose an occupation to see how your points compare.";
const LOAD_FAILED_LINE =
  "We couldn't load the published data. Reload to try again.";
const NO_OCCUPATION = "No occupation chosen";
const COMBINED_RING = "189 • 190 • 491";

function footerText(month: string): string {
  return (
    "This is our best reading of the data, not a guarantee. " +
    `It comes from published SkillSelect figures up to ${month}. ` +
    "Home Affairs and the states can change round sizes, cut-offs and rules at any time, so your real result may be different. " +
    "MigrateLens isn't a registered migration agent; for advice on your own case, talk to one."
  );
}

function stampRing(stamp: Stamp): string {
  if (stamp.kind === "combined") return COMBINED_RING;
  const state = stamp.state ? ` ${stamp.state}` : "";
  return `SUBCLASS ${stamp.visa}${state}`;
}

/** "OCT 2026 • 85 POINTS": the snapshot month and the stamped visa's points. */
function stampBottom(input: OutlookInput, o: ProfileOutlook): string {
  const month = formatMonth(dataMonthKey(input)).toUpperCase();
  const points = o.stamp.kind === "single" ? o.stamp.points : o.points.base;
  return `${month} • ${points} POINTS`;
}

function whoDetail(
  input: OutlookInput,
  o: ProfileOutlook,
  expiry: string | null,
): string {
  const { profile } = input;
  const where = profile.onshore
    ? `onshore${profile.state ? ` in ${profile.state}` : ""}`
    : "offshore";
  const submitted = `EOI submitted ${formatDate(profile.eoiDate)}`;
  const eoi = expiry
    ? ` ${submitted}, expired ${formatDate(expiry)}: a new EOI gets a new date of effect.`
    : isLodged(input)
      ? ` ${submitted}.`
      : "";
  return `${occupationName(input)}, ${o.points.base} points, ${where}.${eoi} Data to ${dataMonth(input)}.`;
}

function reportView(entered: OutlookInput): OutlookView {
  const expiry = eoiExpiry(entered);
  // An expired EOI holds no place in the queue, so plan as for a new one.
  const input = expiry
    ? { ...entered, profile: { ...entered.profile, eoiDate: "" } }
    : entered;
  const o = evaluateProfile(input);
  // From the answers as entered, so the points page keeps the EOI warning.
  const points = calculatePoints(entered.profile, entered.asOf);
  const improve = buildImprove(input, o);
  const wait = estimatedWait(o, input);
  const route = buildRoute(input, o, improve);
  const facts = buildFacts(input, o, wait.text, improve, route);
  const month = dataMonth(input);
  const name = occupationName(input);
  const base = o.points.base;
  // Off the 189 list there is no 189 position to chart.
  const offList = o.v189.offList;
  const cutoffs = offList ? null : cutoffColumns(input.core, base, improve);
  const closed = o.v189.label === "not-invited";
  const queue = offList
    ? null
    : queueView(input.core, input.detail, base, input.profile.eoiDate, closed);
  return {
    kind: "report",
    headline: buildHeadline(input, o, improve),
    whoDetail: whoDetail(entered, o, expiry),
    stamp: o.stamp,
    stampRing: stampRing(o.stamp),
    stampBottom: stampBottom(input, o),
    wait: wait.text,
    visas: visaCards(input, o, wait),
    cutoffs,
    cutoffsEmpty: cutoffs
      ? null
      : offList
        ? `189 isn't available for ${name}, so there are no 189 cut-offs to show.`
        : `No 189 round in the published results lists ${name}, so there are no cut-offs to show.`,
    queue,
    queueEmpty: queue
      ? null
      : offList
        ? `189 isn't available for ${name}, so there's no 189 queue to show.`
        : `SkillSelect hasn't published any 189 EOI counts for ${name}, so there's no queue to show.`,
    route,
    improve,
    improveLabels: improve.mode !== "plain" && improve.mode !== "off-list",
    facts,
    templateRead: readTemplate(facts),
    points,
    pointsPage: buildPointsPage({
      profile: entered.profile,
      points,
      occupation: name,
      asOf: input.asOf,
      month: dataMonthKey(input),
      available189: !o.v189.offList,
    }),
    evidence: buildEvidence(input, o),
    methodLines: [...METHOD_LINES],
    footer: footerText(month),
    dataMonth: month,
  };
}

/** Points and the points page only: no stamp, no labels. */
function pointsOnly(
  input: Omit<OutlookInput, "core" | "detail">,
  line: string,
  occupation: string,
): OutlookView {
  const points = calculatePoints(input.profile, input.asOf);
  // Without a core the checked-in snapshot sets the month.
  const noCore = { ...input, core: null, detail: null };
  const month = dataMonth(noCore);
  const pointsPage = buildPointsPage({
    profile: input.profile,
    points,
    occupation,
    asOf: input.asOf,
    month: dataMonthKey(noCore),
  });
  return {
    kind: "points-only",
    points,
    line,
    pointsPage,
    footer: footerText(month),
    dataMonth: month,
  };
}

export function buildOutlookView(input: OutlookViewInput): OutlookView {
  const { occupation, ...rest } = input;
  if (rest.profile.occupation === "") {
    return pointsOnly(rest, POINTS_ONLY_LINE, NO_OCCUPATION);
  }
  if (occupation.status === "loading") return { kind: "loading" };
  if (occupation.status === "load-failed") {
    const name = occupationName({ ...rest, core: null, detail: null });
    return pointsOnly(rest, LOAD_FAILED_LINE, name);
  }
  if (occupation.status === "dropped") {
    const name = occupationName({ ...rest, core: null, detail: null });
    return pointsOnly(
      rest,
      `${occupation.note}, so this report uses your points only.`,
      name,
    );
  }
  // An occupation with no published data takes the no-core path.
  const ready = occupation.status === "ready";
  return reportView({
    ...rest,
    core: ready ? occupation.core : null,
    detail: ready ? occupation.detail : null,
  });
}
