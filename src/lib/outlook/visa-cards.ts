import type { Interval, StateCode, StateVisa, Visa } from "../data/types";
import { formatSummed } from "../report/copy";
import { STATE_NAMES } from "../state-outlook/context";
import type { OutlookInput, ProfileOutlook } from "./evaluate-profile";
import { lastListedMonth } from "./facts";
import { MIN_POINTS } from "./label-189";
import type { StateLabel } from "./label-state";
import { stampName } from "./labels";
import type { OutlookLabel } from "./labels";
import {
  capital,
  flagNote,
  joinAnd,
  longMonth,
  namedState,
  stateVisaOf,
  stateWhy,
  theState,
  theStateName,
  withoutConfirm,
} from "./phrases";
import { daysBetween } from "./route";
import { roughlyEois } from "./wait";
import type { EstimatedWait } from "./wait";

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
  /** Where the flag's answer lives: the Sharpen questions in the evidence fold. */
  flagHref: "#sharpen" | null;
};

type StateCardText = Pick<VisaCard, "top" | "stampWord" | "caption">;

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
const SHARPEN_HREF = "#sharpen";

function plural(count: number, unit: string): string {
  return `${count} ${count === 1 ? unit : `${unit}s`}`;
}

/**
 * "107–126 EOIs ahead of you." A pool that isn't being invited has no queue,
 * so its suffix is "score higher".
 */
function countSentence(count: Interval, suffix: string): string {
  if (count.max === 0) return `No EOIs ${suffix}.`;
  return `${capital(formatSummed(count))} EOIs ${suffix}.`;
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
    return v189.ahead
      ? `${since} ${countSentence(v189.ahead, "score higher")}`
      : since;
  }
  const days = daysWaiting(input);
  if (days !== null) {
    const waiting = `Waiting ${plural(days, "day")}.`;
    if (wait.pace) {
      return `${waiting} ${roughlyEois(wait.pace.ahead)} ahead.`;
    }
    // Without a pace the higher scores are only part of the queue.
    return v189.ahead
      ? `${waiting} ${countSentence(v189.ahead, "score higher")}`
      : waiting;
  }
  return v189.ahead
    ? countSentence(v189.ahead, "ahead of you")
    : withoutConfirm(v189.why);
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
    flagHref: null,
  };
}

function invitedCaption(state: StateLabel): string {
  if (!state.latest) return `${capital(stateWhy(state))}.`;
  const { count, month } = state.latest;
  return `${capital(theState(state.state))} invited ${formatSummed(count)} EOIs at or below your points in ${longMonth(month)}.`;
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
    flagHref: named?.flag === "needs-answers" ? SHARPEN_HREF : null,
  };
}

/** The 189, 190 and 491 cards, in that order. */
export function visaCards(
  input: OutlookInput,
  o: ProfileOutlook,
  wait: EstimatedWait,
): VisaCard[] {
  return [
    card189(input, o, wait),
    stateCard(input, o, "190"),
    stateCard(input, o, "491"),
  ];
}
