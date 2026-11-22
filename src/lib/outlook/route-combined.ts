import { blockerOf, expiredItems } from "./eligibility";
import type { OutlookInput, ProfileOutlook } from "./evaluate-profile";
import type { Improve } from "./improve";
import { MIN_POINTS } from "./label-189";
import { isLodged } from "./phrases";
import {
  dated,
  improvementStep,
  lodgedStart,
  today,
  watchListing,
} from "./route-steps";
import type { Dated } from "./route-steps";

/** Routes for a combined stamp: no visa is Competitive or better (spec 6.8). */

/** Nothing suits: keep the EOI in, look at other occupations, watch the lists. */
export function nothingSuits(input: OutlookInput, o: ProfileOutlook): Dated[] {
  return [
    today(input, o),
    dated("Keep your EOI in", "189 + 190 + 491", null),
    dated("Check other occupations", "you could be assessed in", null),
    ...watchListing(o),
  ];
}

export function noData(input: OutlookInput, o: ProfileOutlook): Dated[] {
  const { states } = o.listMembership;
  const title =
    states.length === 1
      ? `Check ${states[0]}'s program`
      : "Check state programs";
  // A lodged reader keeps the EOI they have rather than submitting again.
  const eoi = isLodged(input)
    ? dated("Keep your EOI in", "189 + 190 + 491", null)
    : dated("Submit EOI", "189 + 190 + 491", null);
  return [
    today(input, o),
    dated(title, "190 and 491", null),
    eoi,
    dated("Wait for a state", "or a 189 round", null),
  ];
}

/** "Retake your English test", "Renew your skills assessment" or both. */
function renewTitle(reasons: string[]): string {
  const items = expiredItems(reasons);
  const english = items.includes("English test");
  const assessment = items.includes("skills assessment");
  if (english && assessment) return "Renew your English test and assessment";
  return english ? "Retake your English test" : "Renew your skills assessment";
}

/**
 * Below 65 or missing a basic requirement, with no state route to take:
 * the change that opens 189 leads (spec 6.8 "Below 65"). Age can't be
 * changed, so that route says so instead.
 */
export function notEligible(
  input: OutlookInput,
  o: ProfileOutlook,
  improve: Improve,
): Dated[] {
  const blocker = blockerOf(o.points);
  const start = isLodged(input) ? lodgedStart(input, o) : [today(input, o)];
  if (blocker === "age") {
    return [
      ...start,
      dated("Points-tested visas closed", "they need you to be under 45", null),
      dated(
        "Talk to a registered migration agent",
        "about visas without this age limit",
        null,
      ),
    ];
  }
  const opener = improve.opener;
  if (!opener) {
    const need = MIN_POINTS - o.points.base;
    const first =
      blocker === "expired"
        ? dated(
            renewTitle(o.points.ineligibleReasons),
            "a basic requirement",
            null,
          )
        : dated(`Build to ${MIN_POINTS} points`, `you need ${need} more`, null);
    return [
      ...start,
      first,
      dated("Check other occupations", "you could be assessed in", null),
      ...watchListing(o),
    ];
  }
  const eoi = isLodged(input)
    ? dated("Update your EOI", "the day results arrive", null)
    : dated(
        "Submit EOI",
        `189 + 190 + 491, at ${opener.to.points} points`,
        null,
      );
  return [
    ...start,
    improvementStep(opener, blocker === "expired"),
    eoi,
    ...watchListing(o),
  ];
}
