import { formatDate } from "../migration";
import { STATE_NAMES } from "./context";
import type { StreamContext } from "./context";
import type { RelatedWork, Requirement } from "./rules-types";

// How a state rule reads: its label, and which work the state counts.

export type DigitsWork = Exclude<
  RelatedWork,
  "same-occupation" | "any-skilled"
>;

const RELATED_DIGITS: Record<DigitsWork, 2 | 3 | 4> = {
  "anzsco-2-digit": 2,
  "anzsco-3-digit": 3,
  "anzsco-4-digit": 4,
};

export function monthsText(months: number, ofLastMonths?: number): string {
  if (ofLastMonths !== undefined) {
    return `${months} of the last ${ofLastMonths} months`;
  }
  return months === 1 ? "1 month" : `${months} months`;
}

export function yearsText(years: number): string {
  return years === 1 ? "1 year" : `${years} years`;
}

// Ruling P15: the work question names which work the state counts.
export function workText(related: RelatedWork, name: string): string {
  if (related === "same-occupation") return "your nominated occupation";
  if (related === "any-skilled") return "any skilled occupation";
  return `your nominated occupation or one ${name} treats as related (same first ${RELATED_DIGITS[related]} ANZSCO digits)`;
}

/** The work a wider definition adds beyond the nominated occupation. */
export function widerWork(related: DigitsWork | "any-skilled"): string {
  if (related === "any-skilled") return "skilled work in any occupation";
  return `work in a related occupation (same first ${RELATED_DIGITS[related]} ANZSCO digits)`;
}

/** The rule as one line, e.g. "At least 12 months living in South Australia". */
export function requirementLabel(
  requirement: Requirement,
  ctx: StreamContext,
): string {
  const name = STATE_NAMES[ctx.state];
  switch (requirement.kind) {
    case "min-months-living-in-state":
      return `At least ${monthsText(requirement.months, requirement.ofLastMonths)} living in ${name}`;
    case "min-months-working-in-state":
      return `At least ${monthsText(requirement.months, requirement.ofLastMonths)} working in ${name} in ${workText(requirement.related, name)}`;
    case "min-months-living-offshore":
      return `At least ${monthsText(requirement.months, requirement.ofLastMonths)} living offshore`;
    case "job-offer-in-state":
      return `A job offer in ${name}`;
    case "visa-expiry-before":
      return `Current visa expires on or before ${formatDate(requirement.date)}`;
    case "min-years-experience":
      return `At least ${yearsText(requirement.years)} of skilled work in the last ${requirement.withinYears} years in ${workText(requirement.related, name)}`;
    case "lives-regional":
      return "Living in a regional area";
    case "studied-in-state":
      return `Studied in ${name}`;
  }
}
