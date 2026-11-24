import type { StateCode, StateVisa, Visa } from "../data/types";
import {
  STATE_ORDER,
  listMembership,
  type Membership,
} from "../occupation-page/states";
import type { StateRuleData } from "../report/state-outlook-view";
import { STATE_NAMES, joinWords } from "../state-outlook/context";
import type { Cohort } from "../state-outlook/rules-types";
import { visaLines } from "../states-page/state-cards";

/** Where the reader is now: the path picker's first question. */
export type PickerSituation =
  { kind: "offshore" } | { kind: "onshore"; state: StateCode };

export type StateFitStatus =
  /** The state's imported list names the occupation for the reader's situation. */
  | "open-to-you"
  /** Listed, but only for people somewhere else (e.g. living in that state). */
  | "other-situation"
  | "not-listed"
  /** Not on the imported list, but a stream without a list could still take it. */
  | "see-official"
  /** No imported list: we haven't confirmed the state's rules. */
  | "checking"
  /** Every stream for the visa is verified closed this program year. */
  | "closed"
  /** Not on the Home Affairs list for the visa, so no state can nominate it. */
  | "off-federal";

export type StateFit = {
  state: StateCode;
  name: string;
  byVisa: Record<StateVisa, { status: StateFitStatus; text: string }>;
};

export type PathFit = {
  code: string;
  /** The Home Affairs list's flags; null when the list can't be read. */
  visas: Record<Visa, boolean | null>;
  states: StateFit[];
  /** States whose lists name the occupation for the reader, per visa. */
  openToYou: Record<StateVisa, StateCode[]>;
};

const STATE_VISAS: StateVisa[] = ["190", "491"];

function readerCohort(state: StateCode, situation: PickerSituation): Cohort {
  if (situation.kind === "offshore") return "offshore";
  return situation.state === state
    ? "living-in-state"
    : "living-in-other-state";
}

function who(cohorts: Cohort[], state: StateCode): string {
  const parts = cohorts.map((c) =>
    c === "living-in-state"
      ? `people living in ${state}`
      : c === "living-in-other-state"
        ? "people living elsewhere in Australia"
        : "people offshore",
  );
  return joinWords(parts, "or");
}

function isClosed(state: StateCode, visa: StateVisa, data: StateRuleData) {
  const streams =
    data.rules.rules.find((r) => r.state === state && r.visa === visa)
      ?.streams ?? [];
  const lines = visaLines(streams, state, data.rules.programYear);
  return lines[0]?.status === "closed";
}

function fitFor(
  state: StateCode,
  visa: StateVisa,
  member: Membership,
  situation: PickerSituation,
  listedFederally: boolean | null,
  data: StateRuleData,
): StateFit["byVisa"][StateVisa] {
  const year = data.rules.programYear.replace("-", "–");
  if (listedFederally === false) {
    return {
      status: "off-federal",
      text: `Not available: not on the Home Affairs list for ${visa}`,
    };
  }
  if (isClosed(state, visa, data)) {
    return { status: "closed", text: `Closed in ${year}` };
  }
  if (!member.checked) {
    return { status: "checking", text: "Rules being checked" };
  }
  if (!member.listed) {
    return member.unchecked
      ? {
          status: "see-official",
          text: "Not on its imported list; see the official page",
        }
      : { status: "not-listed", text: `Not on its ${year} list` };
  }
  const mine = readerCohort(state, situation);
  if (member.listed.includes(mine)) {
    return {
      status: "open-to-you",
      text: `On its list for ${who([mine], state)}`,
    };
  }
  return {
    status: "other-situation",
    text: `Listed for ${who(member.listed, state)} only`,
  };
}

/**
 * Which visas an occupation can use and which states list it for the
 * reader's situation. A list entry is one rule, not a finding of eligibility.
 */
export function pathFit(
  code: string,
  situation: PickerSituation,
  data: StateRuleData,
): PathFit {
  const entry = data.federal ? (data.federal.entries[code] ?? null) : null;
  const flag = (visa: Visa): boolean | null =>
    data.federal ? (entry?.[visa] ?? false) : null;
  const visas = { "189": flag("189"), "190": flag("190"), "491": flag("491") };
  const states = STATE_ORDER.map((state) => {
    const byVisa = Object.fromEntries(
      STATE_VISAS.map((visa) => [
        visa,
        fitFor(
          state,
          visa,
          listMembership(state, visa, code, data),
          situation,
          visas[visa],
          data,
        ),
      ]),
    ) as StateFit["byVisa"];
    return { state, name: STATE_NAMES[state], byVisa };
  });
  const openToYou = Object.fromEntries(
    STATE_VISAS.map((visa) => [
      visa,
      states
        .filter((s) => s.byVisa[visa].status === "open-to-you")
        .map((s) => s.state),
    ]),
  ) as PathFit["openToYou"];
  return { code, visas, states, openToYou };
}
