import type {
  Cohort,
  OccupationListRef,
  RelatedWork,
  Requirement,
  Sourced,
} from "../../../lib/state-outlook/rules-types";

/**
 * Every rule in this folder is transcribed from
 * docs/research/state-nomination-2026-27.md, whose sources were checked on
 * 17 Nov 2026. No rule here comes from any other browsing.
 */
export const CHECKED_AT = "2026-11-17";

function sourced<T>(
  value: T,
  source: string,
  verification: Sourced<T>["verification"],
  note?: string,
): Sourced<T> {
  const rule: Sourced<T> = {
    value,
    source,
    checkedAt: CHECKED_AT,
    verification,
  };
  if (note !== undefined) rule.note = note;
  return rule;
}

/** A fact the research read directly on the official page ([D]). */
export function verified<T>(
  value: T,
  source: string,
  note?: string,
): Sourced<T> {
  return sourced(value, source, "verified", note);
}

/**
 * Never decides eligibility. Used for:
 * - a search-extract fact ([S]);
 * - a contradiction between official pages (both readings go in `note`);
 * - a directly read rule that Landfall's questions or imported lists cannot
 *   test faithfully (the reason goes in `note`).
 */
export function secondary<T>(
  value: T,
  source: string,
  note?: string,
): Sourced<T> {
  return sourced(value, source, "secondary", note);
}

export const ALL_COHORTS: Cohort[] = [
  "living-in-state",
  "living-in-other-state",
  "offshore",
];
export const IN_STATE: Cohort[] = ["living-in-state"];
export const OFFSHORE: Cohort[] = ["offshore"];

export function list(listId: string, streams?: string[]): OccupationListRef {
  return streams === undefined
    ? { kind: "list", listId }
    : { kind: "list", listId, streams };
}

export const NOT_IMPORTED: OccupationListRef = { kind: "not-imported" };
export const NONE_PUBLISHED: OccupationListRef = { kind: "none-published" };
export const ALL_FEDERAL: OccupationListRef = {
  kind: "all-federally-eligible",
};

/** `ofLastMonths` only for rules phrased "N of the last M months". */
export function livingInState(
  months: number,
  ofLastMonths?: number,
): Requirement {
  return ofLastMonths === undefined
    ? { kind: "min-months-living-in-state", months }
    : { kind: "min-months-living-in-state", months, ofLastMonths };
}

export function workingInState(
  months: number,
  related: RelatedWork,
  ofLastMonths?: number,
): Requirement {
  return ofLastMonths === undefined
    ? { kind: "min-months-working-in-state", months, related }
    : { kind: "min-months-working-in-state", months, related, ofLastMonths };
}

export function livingOffshore(months: number): Requirement {
  return { kind: "min-months-living-offshore", months };
}

export function experience(years: number, withinYears: number): Requirement {
  return { kind: "min-years-experience", years, withinYears };
}

export function visaExpiryBy(date: string): Requirement {
  return { kind: "visa-expiry-before", date };
}

export const JOB_OFFER: Requirement = { kind: "job-offer-in-state" };
export const LIVES_REGIONAL: Requirement = { kind: "lives-regional" };
export const STUDIED_IN_STATE: Requirement = { kind: "studied-in-state" };
