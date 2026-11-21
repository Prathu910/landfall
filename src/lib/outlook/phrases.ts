import index from "../../data/occupation-index.json";
import manifest from "../../data/manifest.json";
import type { MonthKey, StateCode, StateVisa } from "../data/types";
import { STATE_NAMES } from "../state-outlook/context";
import type { OutlookInput, ProfileOutlook } from "./evaluate-profile";
import { CONFIRM } from "./label-189";
import type { StateLabel, VisaLabel } from "./label-state";
import { labelName } from "./labels";

const LONG_MONTHS = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

/** "2026-10" becomes "October 2026". */
export function longMonth(month: MonthKey): string {
  const [year, m] = month.split("-");
  return `${LONG_MONTHS[Number(m) - 1]} ${year}`;
}

/** The ANZSCO name as published (no hand-made plurals); the index covers a missing core. */
export function occupationName(input: OutlookInput): string {
  if (input.core) return input.core.name;
  const code = input.profile.occupation;
  return index.find((entry) => entry.code === code)?.name ?? "your occupation";
}

/** The snapshot month; a missing core still belongs to the checked-in snapshot. */
export function dataMonth(input: OutlookInput): string {
  return longMonth(input.core?.asAt ?? manifest.asAt);
}

/** Lower-cases a leading capital, except in an acronym ("EOI", "WA's") or "English". */
export function lowerFirst(text: string): string {
  const [first, second] = text;
  if (second !== undefined && second !== second.toLowerCase()) return text;
  if (text.startsWith("English")) return text;
  return (first ?? "").toLowerCase() + text.slice(1);
}

/** A 189 why line without its trailing "Confirm your … dates." note. */
export function withoutConfirm(why: string): string {
  return why.endsWith(CONFIRM) ? why.slice(0, -CONFIRM.length) : why;
}

/** "Superior English, +10" becomes "Superior English". */
export function moveName(title: string): string {
  return title.replace(/, \+\d+$/, "");
}

export function joinAnd(items: string[]): string {
  if (items.length < 2) return items.join("");
  return `${items.slice(0, -1).join(", ")} and ${items[items.length - 1]}`;
}

// Territories read with "the" mid-sentence: "the Northern Territory".
const WITH_THE: StateCode[] = ["ACT", "NT"];

const NAMES_WITH_THE = WITH_THE.map((code) => STATE_NAMES[code]);

/** A state's full name as it reads mid-sentence: "the Northern Territory". */
export function theStateName(name: string): string {
  return NAMES_WITH_THE.includes(name) ? `the ${name}` : name;
}

export function theState(state: StateCode): string {
  return theStateName(STATE_NAMES[state]);
}

/** Why a state got its label, from the evidence ladder (spec 6.3). */
export function stateWhy(state: StateLabel): string {
  switch (state.label) {
    case "strong":
      return `${state.confirmedAtOrBelow} invitations at or below your points in the last 3 months, at least half of all it sent`;
    case "competitive":
      return state.confirmedAtOrBelow > 0
        ? `${state.confirmedAtOrBelow} confirmed invitations at or below your points in the last 3 months`
        : "under-20 invitations at or below your points in at least 2 of the last 3 months";
    case "long-wait":
      return state.monthsAtOrBelow6 > 0
        ? `invitations at or below your points in ${state.monthsAtOrBelow6} of the last 6 months, but too few recently`
        : "invitations only above your points in the last 6 months";
    case "not-invited":
      return "no invitations for your occupation in the last 6 months";
    case "not-open":
      return "its rules don't fit your answers";
    default:
      return "no published invitation data for the last 6 months";
  }
}

/**
 * The state a visa can name. Ruling R7: none when its best label is not
 * invited, no data or not open, so a weak case never reads as a route.
 */
export function namedState(visa: VisaLabel | null): StateLabel | null {
  const best = visa?.best ?? null;
  if (!best) return null;
  const weak =
    best.label === "not-invited" ||
    best.label === "no-data" ||
    best.label === "not-open";
  return weak ? null : best;
}

export function stateVisaOf(
  o: ProfileOutlook,
  visa: StateVisa,
): VisaLabel | null {
  return visa === "190" ? o.v190 : o.v491;
}

const FLAG_NOTES = {
  "rules-being-checked": (name: string) =>
    ` We're still checking ${name}'s rules.`,
  "needs-answers": () => " Answer the state questions to confirm it.",
};

/** "Tasmania is Competitive: …. We're still checking Tasmania's rules." */
export function stateSentence(state: StateLabel): string {
  const name = theState(state.state);
  const flag = state.flag ? FLAG_NOTES[state.flag](name) : "";
  const subject = name[0].toUpperCase() + name.slice(1);
  return `${subject} is ${labelName(state.label)}: ${stateWhy(state)}.${flag}`;
}
