import type { Interval, StateVisa } from "../data/types";
import { MONTH_NAMES } from "../migration";
import { formatCount, isMasked } from "../report/copy";
import { STATE_NAMES } from "../state-outlook/context";
import type { OutlookInput, ProfileOutlook } from "./evaluate-profile";
import type { Improve, Loss, Move } from "./improve";
import { MIN_POINTS } from "./label-189";
import { labelName } from "./labels";
import {
  dataMonth,
  longMonth,
  lowerFirst,
  moveName,
  namedState,
  occupationName,
  stateSentence,
  stateVisaOf,
  withoutConfirm,
} from "./phrases";
import type { ReportFacts } from "./read-contract";
import type { Route } from "./route";

type Facts = ReportFacts;
type Count = Facts["counts"][number];
type Change = Facts["changes"][number];

const COMBINED_VISA = "189, 190 and 491";
/** Marks a dated loss placed between route steps. */
export const DEADLINE = "Deadline: ";
// Windows the labels read (last 3 listed rounds, last 4 rounds, last 6
// months), plus the 60 days to lodge after an invitation.
const WINDOW_NUMBERS = [3, 4, 6, 60];
const EXACT_DATE = /\b\d{1,2} (\w{3}) (\d{4})\b/g;
/** "9 Aug 2027" becomes "August 2027": the facts hold no exact dates. */
function monthOnly(text: string): string {
  return text.replace(EXACT_DATE, (whole, mon: string, year: string) => {
    const at = MONTH_NAMES.findIndex((name) => name === mon);
    if (at < 0) return whole;
    return longMonth(`${year}-${String(at + 1).padStart(2, "0")}`);
  });
}

/** The latest round that listed the occupation, as "November 2024". */
export function lastListedMonth(input: OutlookInput): string | null {
  const round = input.core?.rounds189.find((r) => r.cutoff !== null);
  return round ? longMonth(round.date.slice(0, 7)) : null;
}

function caption189(input: OutlookInput, o: ProfileOutlook): string {
  const why = withoutConfirm(o.v189.why);
  const last = lastListedMonth(input);
  if (o.v189.label !== "not-invited" || !last) return why;
  return `${why} The last round that listed it was in ${last}.`;
}

function stateCaption(
  input: OutlookInput,
  o: ProfileOutlook,
  visa: StateVisa,
): string {
  const label = stateVisaOf(o, visa);
  const state = namedState(label);
  if (state) return stateSentence(state);
  if (!input.core) {
    const listed =
      o.listMembership[visa === "190" ? "federal190" : "federal491"];
    const list = listed ? "is" : "isn't";
    return `No state invitations are published for your occupation. It ${list} on the federal list for ${visa}.`;
  }
  if (label?.label === "not-open") return "No state's rules fit your answers.";
  if (label?.label === "not-invited") {
    return "No state open to you has invited your occupation in the last 6 months.";
  }
  return "No state has published invitation data for the last 6 months.";
}

function visas(input: OutlookInput, o: ProfileOutlook): Facts["visas"] {
  const { points } = o;
  const entry = (visa: StateVisa, at: number) => {
    const label = stateVisaOf(o, visa);
    const state = namedState(label);
    return {
      visa,
      label: labelName(label?.label ?? "no-data"),
      state: state ? STATE_NAMES[state.state] : null,
      points: at,
      caption: stateCaption(input, o, visa),
    };
  };
  return [
    {
      visa: "189",
      label: labelName(o.v189.label, o.v189.tooFew),
      state: null,
      points: points.base,
      caption: caption189(input, o),
    },
    entry("190", points.subclass190),
    entry("491", points.subclass491),
  ];
}

function stamp(o: ProfileOutlook): Facts["stamp"] {
  const { stamp } = o;
  const label = labelName(stamp.label, stamp.tooFew);
  if (stamp.kind === "combined") {
    return { visa: COMBINED_VISA, state: null, label };
  }
  return {
    visa: stamp.visa,
    state: stamp.state ? STATE_NAMES[stamp.state] : null,
    label,
  };
}

/** A masked count is read as "under 20", so 20 is the number it may quote. */
function intervalNumbers(count: Interval): number[] {
  if (isMasked(count)) return [20];
  return count.min === count.max ? [count.min] : [count.min, count.max];
}

function countOf(name: string, count: Interval): Count {
  return { name, text: formatCount(count), numbers: intervalNumbers(count) };
}

function counts(input: OutlookInput, o: ProfileOutlook): Count[] {
  const { v189 } = o;
  const list: Count[] = [];
  if (v189.ahead)
    list.push(countOf("189 EOIs with a higher score", v189.ahead));
  if (v189.tied) list.push(countOf("189 EOIs tied at your points", v189.tied));
  if (v189.lastThree.length > 0) {
    list.push({
      name: "189 cut-offs of the last listed rounds, newest first",
      text: v189.lastThree.join(", "),
      numbers: v189.lastThree,
    });
  }
  const recent = input.core?.rounds189.slice(0, 6) ?? [];
  if (recent.length > 0) {
    const enough = recent.filter(
      (r) => r.cutoff !== null && r.cutoff <= o.points.base,
    ).length;
    list.push({
      name: `189 rounds of the last ${recent.length} with a cut-off at or below your points`,
      text: String(enough),
      numbers: [enough, recent.length],
    });
  }
  for (const visa of ["190", "491"] as const) {
    const state = namedState(stateVisaOf(o, visa));
    if (!state?.latest) continue;
    const where = `${visa} ${STATE_NAMES[state.state]}`;
    const month = longMonth(state.latest.month);
    list.push(
      countOf(
        `${where} invitations at or below your points in ${month}`,
        state.latest.count,
      ),
    );
  }
  return list;
}

function route(r: Route): string[] {
  const steps = r.steps.map((step) => {
    const at =
      step.points === null
        ? ""
        : `, ${step.points} points${step.label ? `, ${labelName(step.label)}` : ""}`;
    return monthOnly(`${step.title} (${step.sub}${at})`);
  });
  // Insert from the last deadline so earlier indexes stay valid.
  for (const deadline of [...r.deadlines].reverse()) {
    const month = longMonth(deadline.date.slice(0, 7));
    const text = `${DEADLINE}${deadline.title} (${month})`;
    steps.splice(deadline.afterStep + 1, 0, text);
  }
  return steps;
}

function moveTitle(move: Move): string {
  if (move.id !== "combined") return moveName(move.title);
  return move.detail.replace(/ together\..*$/, "");
}

function moveChange(move: Move): Change {
  return {
    title: moveTitle(move),
    fromPoints: move.from.points,
    toPoints: move.to.points,
    toLabel: labelName(move.to.label),
    month: move.date ? longMonth(move.date.slice(0, 7)) : null,
  };
}

/** Sentence-ready loss titles; losses.ts titles carry the exact date. */
function lossTitle(loss: Loss): string {
  const plain = loss.title.replace(/, \d{1,2} \w{3} \d{4}.*$/, "");
  if (loss.kind === "points") {
    const cost = loss.from.points - loss.to.points;
    const age = plain.match(/(\d+)\w* birthday/)?.[1];
    const event = age ? `Turning ${age}` : plain;
    return `${event} costs ${cost} points`;
  }
  return plain.startsWith("Your ") ? plain : `Your ${lowerFirst(plain)}`;
}

function lossChange(loss: Loss): Change {
  return {
    title: lossTitle(loss),
    fromPoints: loss.from.points,
    toPoints: loss.to.points,
    toLabel: labelName(loss.to.label),
    month: longMonth(loss.date.slice(0, 7)),
  };
}

/** The biggest jump first, then the other moves, then dated losses by date. */
function changes(improve: Improve): Change[] {
  const best = improve.moves.filter((m) => m.best);
  const rest = improve.moves.filter((m) => !m.best);
  return [
    ...[...best, ...rest].map(moveChange),
    ...improve.losses.map(lossChange),
  ];
}

export function buildFacts(
  input: OutlookInput,
  o: ProfileOutlook,
  wait: string,
  improve: Improve,
  r: Route,
): ReportFacts {
  const { points } = o;
  const nomination = [
    points.subclass190 - points.base,
    points.subclass491 - points.base,
  ];
  const list = changes(improve);
  const deltas = list.map((c) => Math.abs(c.toPoints - c.fromPoints));
  return {
    occupation: occupationName(input),
    dataMonth: dataMonth(input),
    stamp: stamp(o),
    visas: visas(input, o),
    counts: counts(input, o),
    route: route(r),
    wait: monthOnly(wait),
    changes: list,
    extraNumbers: [MIN_POINTS, ...nomination, ...deltas, ...WINDOW_NUMBERS],
  };
}
