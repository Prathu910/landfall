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
import { monthsText, widerWork, workText, yearsText } from "./wording";

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

/** Records which answer decided a verdict, so the question stays editable. */
function answered(field: keyof Profile, verdict: Verdict): Verdict {
  return { ...verdict, field };
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
  if (value >= test.months) {
    return answered(test.field, pass(`${monthsText(value)} ${test.place}`));
  }
  if (test.ofLastMonths !== undefined) {
    return answered(
      test.field,
      unverified(
        `Under ${required} in a row ${test.place}; ${monthsText(test.months, test.ofLastMonths)} may still be met`,
      ),
    );
  }
  return answered(test.field, fail(`Under ${required} ${test.place}`));
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

// Ruling P31: one answer serves states that count different work, so an
// answer below a wider definition's minimum can't show the rule is missed.
function shortOfExperience(
  years: number,
  window: number,
  related: RelatedWork,
  ctx: StreamContext,
): Verdict {
  if (related === "same-occupation") {
    return fail(
      `Under ${yearsText(years)} of skilled work in the last ${window} years`,
    );
  }
  return unverified(
    `Under ${yearsText(years)} in the last ${window} years by your answer; ${STATE_NAMES[ctx.state]} also counts ${widerWork(related)}`,
  );
}

function experience(
  requirement: Extract<Requirement, { kind: "min-years-experience" }>,
  ctx: StreamContext,
): Verdict {
  const { years, withinYears, related } = requirement;
  const window = experienceField(withinYears);
  const value = ctx.profile[window.field];
  const topic = `years of skilled work in the last ${window.years} years`;
  if (value === null || value === undefined) {
    return {
      ...ask(
        window.field,
        topic,
        `How many years of skilled work have you done in the last ${window.years} years?`,
      ),
      related,
    };
  }
  const verdict =
    value >= years
      ? pass(
          `${yearsText(value)} of skilled work in the last ${window.years} years`,
        )
      : shortOfExperience(years, window.years, related, ctx);
  return { ...answered(window.field, verdict), related };
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
  return answered(
    "visaExpiry",
    expiry <= date
      ? pass(`Your visa expires by ${formatDate(date)}`)
      : fail(`Your visa expires after ${formatDate(date)}`),
  );
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
  return answered(
    "jobOfferState",
    offer === ctx.state
      ? pass(`Job offer in ${name}`)
      : fail(`No job offer in ${name}`),
  );
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
  return answered(
    "livesRegional",
    regional
      ? pass("You live in a regional area")
      : fail("You don't live in a regional area"),
  );
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
  return answered(
    "studyState",
    studied === ctx.state
      ? pass(`Studied in ${name}`)
      : fail(`You didn't study in ${name}`),
  );
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
    case "min-months-working-in-state": {
      const verdict = inStateMonths(
        {
          ...requirement,
          field: "monthsWorkingInState",
          place: `working in ${name}`,
          question: `How many continuous months, up to now, have you worked in ${name} in ${workText(requirement.related, name)}?`,
        },
        cohorts,
        ctx,
      );
      // The question names the state's definition of related work, answered or not.
      return verdict.field === undefined
        ? verdict
        : { ...verdict, related: requirement.related };
    }
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
      return experience(requirement, ctx);
    case "lives-regional":
      return livesRegional(ctx.profile);
    case "studied-in-state":
      return studiedInState(ctx);
  }
}
