import type { Interval, StateCode, StateVisa, Visa } from "../data/types";
import { formatSummed } from "../report/copy";
import { STATE_NAMES } from "../state-outlook/context";
import type { OutlookInput, ProfileOutlook } from "./evaluate-profile";
import { lastListedMonth } from "./facts";
import { MIN_POINTS, isOffList } from "./label-189";
import type { StateLabel } from "./label-state";
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
import { listedBy, stampFace } from "./stamp-face";
import type { FreeStamp } from "./stamp-face";
import { roughlyEois } from "./wait";
import type { EstimatedWait } from "./wait";

export type VisaCard = FreeStamp & {
  title: string;
  caption: string;
  flagText: string | null;
  /** Where the flag's answer lives: the Sharpen questions in the evidence fold. */
  flagHref: "#sharpen" | null;
};

const TITLES: Record<Visa, string> = {
  "189": "189 Independent",
  "190": "190 Nominated",
  "491": "491 Regional",
};
const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;
const OFF_LIST_CAPTION = "Not on the Home Affairs list for 189.";
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
  if (isOffList(v189)) return OFF_LIST_CAPTION;
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
  return {
    ...stampFace(input, o, "189"),
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

/** The caption of a stamp named from the state lists that hold the occupation. */
function listCaption(visa: StateVisa, states: StateCode[]): string {
  const names = joinAnd(states.map((s) => theStateName(STATE_NAMES[s])));
  if (visa === "190") return `Listed by ${names}.`;
  return states.length === 1
    ? capital(`Check ${names}'s regional program.`)
    : capital(`Check the regional programs of ${names}.`);
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
  const face = stampFace(input, o, visa);
  const named = namedState(stateVisaOf(o, visa));
  const listed = listedBy(o, visa, face.label);
  let caption: string;
  if (named) caption = invitedCaption(named);
  else if (listed.length > 0) caption = listCaption(visa, listed);
  else caption = unnamedCaption(input, face.label);
  return {
    ...face,
    title: TITLES[visa],
    caption,
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
