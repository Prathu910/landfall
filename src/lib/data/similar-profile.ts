import { latestMonthKeys } from "./invitations";
import type { MonthlyInvited } from "./invitations";
import { parseCountText } from "./published-count";
import type {
  Interval,
  OccupationDetail,
  ProfileAttribute,
  StateKey,
  StateVisa,
  Visa,
} from "./types";

export function similarProfileInvited(
  detail: OccupationDetail,
  visa: Visa,
  attribute: ProfileAttribute,
  value: string,
  scope:
    | { kind: "national"; months?: number }
    | { kind: "state"; visa: StateVisa; state: StateKey },
): { perMonth?: MonthlyInvited[]; latest?: Interval } | undefined {
  if (scope.kind === "state") {
    const text =
      detail.invitedProfileState[scope.visa]?.[scope.state]?.[attribute]?.[
        value
      ];
    return text === undefined ? undefined : { latest: parseCountText(text) };
  }
  const byMonth = detail.invitedProfile[visa]?.[attribute]?.[value];
  if (!byMonth) return undefined;
  const perMonth = latestMonthKeys(byMonth, scope.months ?? 12).map((asAt) => ({
    asAt,
    invitedAtLeast: parseCountText(byMonth[asAt]),
  }));
  return { perMonth, latest: perMonth.at(-1)?.invitedAtLeast };
}
