import { formatDate } from "../migration";
import type { Profile } from "../migration";
import {
  ask,
  cohortIn,
  fail,
  pass,
  STATE_NAMES,
  STATE_QUESTION,
  unverified,
} from "./context";
import type { StreamContext, Verdict } from "./context";
import type { Cohort, RelatedWork, Requirement } from "./rules-types";

type MonthsField =
  "monthsLivingInState" | "monthsWorkingInState" | "monthsLivingOffshore";
type ExperienceField =
  "yearsExperienceLast3" | "yearsExperienceLast5" | "yearsExperienceLast10";

/** A months rule, the answer that tests it and how to ask for it. */
type MonthsTest = {
  months: number;
  ofLastMonths?: number;
  field: MonthsField;
  place: string; // "living in South Australia"
  question: string;
};

const RELATED_DIGITS: Record<Exclude<RelatedWork, "same-occupation">, 2 | 3> = {
  "anzsco-2-digit": 2,
  "anzsco-3-digit": 3,
};

function monthsText(months: number, ofLastMonths?: number): string {
  if (ofLastMonths !== undefined) {
    return `${months} of the last ${ofLastMonths} months`;
  }
  return months === 1 ? "1 month" : `${months} months`;
}

function yearsText(years: number): string {
  return years === 1 ? "1 year" : `${years} years`;
}

// Ruling P15: the work question names which work the state counts.
function workText(related: RelatedWork, name: string): string {
  if (related === "same-occupation") return "your nominated occupation";
  return `your nominated occupation or one ${name} treats as related (same first ${RELATED_DIGITS[related]} ANZSCO digits)`;
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
      return `At least ${yearsText(requirement.years)} of skilled work in the last ${requirement.withinYears} years`;
    case "lives-regional":
      return "Living in a regional area";
    case "studied-in-state":
      return `Studied in ${name}`;
  }
}

// Ruling P16: answers are continuous months up to now, so a short streak can
// still meet an "N of the last M months" rule.
function compareMonths(
  test: MonthsTest,
  value: number | null | undefined,
): Verdict {
  const required = monthsText(test.months);
  if (value === null || value === undefined) {
    return ask(test.field, `months ${test.place}`, test.question);
  }
  if (value >= test.months) return pass(`${monthsText(value)} ${test.place}`);
  if (test.ofLastMonths !== undefined) {
    return unverified(
      `Under ${required} in a row ${test.place}; ${monthsText(test.months, test.ofLastMonths)} may still be met`,
    );
  }
  return fail(`Under ${required} ${test.place}`);
}

// Rulings P2 and P19: the months answers are about the state the user lives in.
function inStateMonths(
  test: MonthsTest,
  cohorts: Cohort[],
  ctx: StreamContext,
): Verdict {
  const name = STATE_NAMES[ctx.state];
  const cohort = cohortIn(ctx.profile, ctx.state);
  if (cohort === null) return STATE_QUESTION;
  if (
    cohort === "living-in-other-state" &&
    cohorts.includes("living-in-other-state")
  ) {
    return unverified(
      `Not checked: months ${test.place} while you live in another state`,
    );
  }
  if (cohort !== "living-in-state") {
    return fail(`You don't currently live in ${name}`);
  }
  return compareMonths(test, ctx.profile[test.field]);
}

// Ruling P14: the narrowest answered window that covers the rule's window.
function experienceField(withinYears: number): {
  field: ExperienceField;
  years: number;
} {
  if (withinYears <= 3) return { field: "yearsExperienceLast3", years: 3 };
  if (withinYears <= 5) return { field: "yearsExperienceLast5", years: 5 };
  return { field: "yearsExperienceLast10", years: 10 };
}

function experience(
  years: number,
  withinYears: number,
  profile: Profile,
): Verdict {
  const window = experienceField(withinYears);
  const value = profile[window.field];
  const topic = `years of skilled work in the last ${window.years} years`;
  if (value === null || value === undefined) {
    return ask(
      window.field,
      topic,
      `How many years of skilled work have you done in the last ${window.years} years?`,
    );
  }
  return value >= years
    ? pass(
        `${yearsText(value)} of skilled work in the last ${window.years} years`,
      )
    : fail(
        `Under ${yearsText(years)} of skilled work in the last ${window.years} years`,
      );
}

function visaExpiry(date: string, profile: Profile): Verdict {
  const expiry = profile.visaExpiry;
  if (!expiry || formatDate(expiry) === "—") {
    return ask(
      "visaExpiry",
      "your visa expiry date",
      "When does your current visa expire?",
    );
  }
  // Valid YYYY-MM-DD strings compare in calendar order.
  return expiry <= date
    ? pass(`Your visa expires by ${formatDate(date)}`)
    : fail(`Your visa expires after ${formatDate(date)}`);
}

function jobOffer(ctx: StreamContext): Verdict {
  const name = STATE_NAMES[ctx.state];
  const offer = ctx.profile.jobOfferState;
  if (offer === null || offer === undefined) {
    return ask(
      "jobOfferState",
      `a job offer in ${name}`,
      "Which state or territory, if any, has a job offer for you?",
    );
  }
  return offer === ctx.state
    ? pass(`Job offer in ${name}`)
    : fail(`No job offer in ${name}`);
}

function livesRegional(profile: Profile): Verdict {
  const regional = profile.livesRegional;
  if (regional === null || regional === undefined) {
    return ask(
      "livesRegional",
      "living in a regional area",
      "Do you live in a regional area?",
    );
  }
  return regional
    ? pass("You live in a regional area")
    : fail("You don't live in a regional area");
}

function studiedInState(ctx: StreamContext): Verdict {
  const name = STATE_NAMES[ctx.state];
  const studied = ctx.profile.studyState;
  if (studied === null || studied === undefined) {
    return ask(
      "studyState",
      "where you studied",
      "Which state or territory did you study in?",
    );
  }
  return studied === ctx.state
    ? pass(`Studied in ${name}`)
    : fail(`You didn't study in ${name}`);
}

/** Judges a verified, fresh requirement against the user's answers. */
export function judgeRequirement(
  requirement: Requirement,
  cohorts: Cohort[],
  ctx: StreamContext,
): Verdict {
  const name = STATE_NAMES[ctx.state];
  switch (requirement.kind) {
    case "min-months-living-in-state":
      return inStateMonths(
        {
          ...requirement,
          field: "monthsLivingInState",
          place: `living in ${name}`,
          question: `How many continuous months, up to now, have you lived in ${name}?`,
        },
        cohorts,
        ctx,
      );
    case "min-months-working-in-state":
      return inStateMonths(
        {
          ...requirement,
          field: "monthsWorkingInState",
          place: `working in ${name}`,
          question: `How many continuous months, up to now, have you worked in ${name} in ${workText(requirement.related, name)}?`,
        },
        cohorts,
        ctx,
      );
    case "min-months-living-offshore":
      if (ctx.profile.onshore) return fail("You live in Australia now");
      return compareMonths(
        {
          ...requirement,
          field: "monthsLivingOffshore",
          place: "living offshore",
          question:
            "How many continuous months, up to now, have you lived outside Australia?",
        },
        ctx.profile.monthsLivingOffshore,
      );
    case "job-offer-in-state":
      return jobOffer(ctx);
    case "visa-expiry-before":
      return visaExpiry(requirement.date, ctx.profile);
    case "min-years-experience":
      return experience(
        requirement.years,
        requirement.withinYears,
        ctx.profile,
      );
    case "lives-regional":
      return livesRegional(ctx.profile);
    case "studied-in-state":
      return studiedInState(ctx);
  }
}
