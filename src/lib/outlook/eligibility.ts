import type { PointsResult } from "../migration";

/**
 * Why a reader can't be invited yet. Age can't be fixed by points or a
 * retake; an expired English test or skills assessment can be renewed;
 * "points" means under 65 with the basics met.
 */
export type Blocker = "age" | "expired" | "points";

// Reasons as calculatePoints words them in `ineligibleReasons`.
const AGE_OVER = "age 45 or over";
export const AGE_UNDER = "age under 18";
const EXPIRED: Record<string, string> = {
  "English test expired": "English test",
  "skills assessment expired": "skills assessment",
};

/** Only meaningful when 189 reads "not eligible": otherwise it is "points". */
export function blockerOf(points: PointsResult): Blocker {
  const reasons = points.ineligibleReasons;
  if (reasons.includes(AGE_OVER) || reasons.includes(AGE_UNDER)) return "age";
  if (reasons.some((r) => r in EXPIRED)) return "expired";
  return "points";
}

/** "English test", "skills assessment" or both, in that order. */
export function expiredItems(reasons: string[]): string[] {
  return reasons.flatMap((r) => (r in EXPIRED ? [EXPIRED[r]] : []));
}

/** "your English test" / "your English test and skills assessment". */
export function expiredPhrase(reasons: string[]): string {
  return `your ${expiredItems(reasons).join(" and ")}`;
}

/** The age rule, as plain as it can be said. */
export function ageRule(reasons: string[]): string {
  return reasons.includes(AGE_UNDER)
    ? "need you to be 18 or over when you're invited"
    : "need you to be under 45 when you're invited";
}

/** The 189 "why" for a reader who fails a basic requirement. */
export function requirementWhy(reasons: string[]): string {
  if (reasons.includes(AGE_OVER) || reasons.includes(AGE_UNDER)) {
    return `189, 190 and 491 all ${ageRule(reasons)}, and points can't change that.`;
  }
  const items = expiredItems(reasons);
  if (items.length === 0) {
    return "You don't meet the basic age, English or skills assessment requirements yet.";
  }
  const verb = items.length === 1 ? "has" : "have";
  const valid =
    items.length === 1
      ? "a valid one is a basic requirement"
      : "valid ones are basic requirements";
  return `Your ${items.join(" and ")} ${verb} expired, and ${valid}.`;
}
