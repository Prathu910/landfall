import type { OccupationCore, StateCode, StateVisa } from "../data/types";
import { sumIntervals, parseCountText } from "../data/published-count";
import { formatCount, formatMonth } from "../report/copy";
import type { StateRuleData } from "../report/state-outlook-view";
import { STATE_NAMES, joinWords } from "../state-outlook/context";
import type {
  Cohort,
  OccupationListRef,
  Stream,
} from "../state-outlook/rules-types";

export type StateRow = {
  state: StateCode;
  name: string;
  onList: string;
  openTo: string;
  invited190: string;
  href: string | null;
};

const ORDER: StateCode[] = [
  "NSW",
  "VIC",
  "QLD",
  "WA",
  "SA",
  "ACT",
  "TAS",
  "NT",
];
const CHECKING = "Rules being checked";
const COHORT_ORDER: Cohort[] = [
  "living-in-state",
  "living-in-other-state",
  "offshore",
];

/** Cohorts a stream's list admits the occupation for; null when not listed. */
function listedCohorts(
  ref: OccupationListRef,
  visa: StateVisa,
  code: string,
  data: StateRuleData,
): Cohort[] | null | "unchecked" {
  if (ref.kind !== "list") return "unchecked";
  const entry = data.lists[ref.listId]?.entries[code];
  const cohorts = entry?.[visa];
  if (!entry || !cohorts) return null;
  if (ref.streams) {
    const tags = entry.streams?.[visa] ?? [];
    if (!ref.streams.some((t) => tags.includes(t))) return null;
  }
  return cohorts;
}

type Membership = {
  listed: Cohort[] | null;
  /** Some stream is judged against an imported list. */
  checked: boolean;
  /** Some stream is not list-based, so it could admit the code. */
  unchecked: boolean;
};

function membership(
  state: StateCode,
  visa: StateVisa,
  code: string,
  data: StateRuleData,
): Membership {
  const rule = data.rules.rules.find(
    (r) => r.state === state && r.visa === visa,
  );
  const found = new Set<Cohort>();
  let checked = false;
  let unchecked = false;
  let listed = false;
  for (const stream of rule?.streams ?? ([] as Stream[])) {
    const result = listedCohorts(stream.occupations.value, visa, code, data);
    if (result === "unchecked") {
      unchecked = true;
      continue;
    }
    checked = true;
    if (result) {
      listed = true;
      result.forEach((c) => found.add(c));
    }
  }
  return { listed: listed ? [...found] : null, checked, unchecked };
}

function openTo(cohorts: Cohort[], state: StateCode): string {
  const parts = COHORT_ORDER.filter((c) => cohorts.includes(c)).map((c) =>
    c === "living-in-state"
      ? `Living in ${state}`
      : c === "living-in-other-state"
        ? "elsewhere in Australia"
        : "offshore",
  );
  if (parts.length === 1 && cohorts.includes("living-in-state")) {
    return `${parts[0]} only`;
  }
  const text = joinWords(parts, "or");
  return text.charAt(0).toUpperCase() + text.slice(1);
}

/** The column counts EOIs in INVITED status at the snapshot, not a month's invitations. */
export function invitedHeading(core: OccupationCore): string {
  return `Invited for 190, as at ${formatMonth(core.asAt)}`;
}

function invited190(core: OccupationCore, state: StateCode): string {
  const month = core.stateInvited["190"]?.[state]?.[core.asAt];
  if (!month) return "Not published";
  return formatCount(sumIntervals(Object.values(month).map(parseCountText)));
}

function hrefFor(state: StateCode, data: StateRuleData): string | null {
  const rule = data.rules.rules.find(
    (r) => r.state === state && r.visa === "190",
  );
  const source = rule?.streams[0]?.status.source;
  return source?.startsWith("https://") ? source : null;
}

export function stateRows(
  code: string,
  core: OccupationCore,
  data: StateRuleData,
): StateRow[] {
  return ORDER.map((state) => {
    const m190 = membership(state, "190", code, data);
    const m491 = membership(state, "491", code, data);
    const base = {
      state,
      name: STATE_NAMES[state],
      invited190: invited190(core, state),
      href: hrefFor(state, data),
    };
    if (!m190.checked && !m491.checked) {
      return { ...base, onList: CHECKING, openTo: CHECKING };
    }
    const visas = [m190.listed && "190", m491.listed && "491"].filter(
      (v): v is string => Boolean(v),
    );
    if (visas.length === 0) {
      // A stream we cannot check may still admit the code: no negative claim.
      if (m190.unchecked || m491.unchecked) {
        return {
          ...base,
          onList: "Not on its imported list",
          openTo: "See the official page",
        };
      }
      return {
        ...base,
        onList: "Not on its 2026–27 list",
        openTo: "Not applicable",
      };
    }
    const cohorts = [...(m190.listed ?? []), ...(m491.listed ?? [])];
    return {
      ...base,
      onList: joinWords(visas, "and"),
      openTo: openTo(cohorts, state),
    };
  });
}
