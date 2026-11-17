import type { MonthlyInvited } from "./invitations";
import { calendarMonths, splitCoverage } from "./months";
import { parseCountText } from "./published-count";
import type {
  CountText,
  Interval,
  MonthKey,
  OccupationDetail,
  ProfileAttribute,
  StateKey,
  StateVisa,
  Visa,
} from "./types";

export type SimilarProfileInvited = {
  perMonth?: MonthlyInvited[]; // fetched months in the window, oldest first
  notPublished?: MonthKey[]; // window months that were not fetched
  latest?: Interval; // the as-at month only; absent when it was not fetched
};

/** A fetched slice with no row for `value` is zero. */
function countFor(values: Record<string, CountText>, value: string): Interval {
  const text = values[value];
  return text === undefined ? { min: 0, max: 0 } : parseCountText(text);
}

/**
 * INVITED EOIs that share one profile value. `value` is the dashboard's
 * displayed text: English Test Score and PartnerSkills Score are points
 * ("20", "10", "0" and "10", "5", "0"), Australian Study Flag is "Y" or "N",
 * and Professional Year is "N" or "-1" (-1 appears to mean not recorded).
 * Returns undefined when the attribute (or state) was not fetched at all.
 */
export function similarProfileInvited(
  detail: OccupationDetail,
  visa: Visa,
  attribute: ProfileAttribute,
  value: string,
  scope:
    | { kind: "national"; months?: number }
    | { kind: "state"; visa: StateVisa; state: StateKey },
): SimilarProfileInvited | undefined {
  if (scope.kind === "state") {
    const values =
      detail.invitedProfileState[scope.visa]?.[scope.state]?.[attribute];
    return values === undefined
      ? undefined
      : { latest: countFor(values, value) };
  }
  const byMonth = detail.invitedProfile[visa]?.[attribute];
  if (!byMonth) return undefined;
  const { covered, notPublished } = splitCoverage(
    calendarMonths(detail.asAt, scope.months ?? 12),
    byMonth,
  );
  const perMonth = covered.map((asAt) => ({
    asAt,
    invitedAtLeast: countFor(byMonth[asAt], value),
  }));
  const asAtValues = byMonth[detail.asAt];
  return {
    perMonth,
    notPublished,
    latest: asAtValues === undefined ? undefined : countFor(asAtValues, value),
  };
}
