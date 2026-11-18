import type { StateCode, StateVisa } from "../data/types";
import type { Profile } from "../migration";
import type {
  Cohort,
  FederalList,
  ImportedList,
  RelatedWork,
} from "./rules-types";

/** Every jurisdiction, keyed by code; the key order is the code order. */
export const STATE_NAMES: Record<StateCode, string> = {
  ACT: "Australian Capital Territory",
  NSW: "New South Wales",
  NT: "Northern Territory",
  QLD: "Queensland",
  SA: "South Australia",
  TAS: "Tasmania",
  VIC: "Victoria",
  WA: "Western Australia",
};

export const STATE_CODES = Object.keys(STATE_NAMES) as StateCode[];

/** Everything one stream's rules are judged against. */
export type StreamContext = {
  state: StateCode;
  visa: StateVisa;
  code: string; // ANZSCO code of the nominated occupation
  profile: Profile;
  lists: Record<string, ImportedList>;
  federal: FederalList | null;
  asOf: string; // YYYY-MM-DD
  programYear: string; // display form, "2026–27"
};

export type Outcome = "pass" | "fail" | "needs-answer" | "unverified";

/** What one verified, fresh rule says about this user. */
export type Verdict = {
  outcome: Outcome;
  // The deciding fact, short: the reason for a fail or unverified, the topic
  // of the missing answer for needs-answer, the rule met for a pass.
  finding: string;
  question?: string;
  field?: keyof Profile;
  related?: RelatedWork; // which work counts, for a work-months question
};

export const pass = (finding: string): Verdict => ({
  outcome: "pass",
  finding,
});
export const fail = (finding: string): Verdict => ({
  outcome: "fail",
  finding,
});
export const unverified = (finding: string): Verdict => ({
  outcome: "unverified",
  finding,
});
export const ask = (
  field: keyof Profile,
  topic: string,
  question: string,
): Verdict => ({ outcome: "needs-answer", finding: topic, question, field });

export const STATE_QUESTION = ask(
  "state",
  "your current state or territory",
  "Which state or territory do you live in now?",
);

function isStateCode(value: string): value is StateCode {
  return (STATE_CODES as string[]).includes(value);
}

/** The user's cohort for `state`; null when they live in Australia but have not said where. */
export function cohortIn(profile: Profile, state: StateCode): Cohort | null {
  if (!profile.onshore) return "offshore";
  if (profile.state === state) return "living-in-state";
  return isStateCode(profile.state) ? "living-in-other-state" : null;
}

/** "a", "a and b", "a, b and c" (or "or"). */
export function joinWords(items: string[], conjunction: "and" | "or"): string {
  if (items.length <= 1) return items.join("");
  return `${items.slice(0, -1).join(", ")} ${conjunction} ${items[items.length - 1]}`;
}
