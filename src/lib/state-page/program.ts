import type { StateCode, StateVisa } from "../data/types";
import { openTo } from "../occupation-page/states";
import type { StateRuleData } from "../report/state-outlook-view";
import type { StateVisaRules } from "../state-outlook/rules-types";

export const STATE_VISAS: readonly StateVisa[] = ["190", "491"];
const CHECKING = "Rules being checked";

export type StreamRow = {
  visa: StateVisa;
  name: string;
  status: string;
  who: string;
  checked: string; // YYYY-MM-DD
  verified: boolean;
};

export type SelectionLine = {
  visa: StateVisa;
  text: string;
  checked: string; // YYYY-MM-DD
  verified: boolean;
  scoreSystem: { name: string; url: string } | null;
  resultsUrl: string | null;
};

const STATUS_TEXT = {
  open: "Open",
  restricted: "Open with restrictions",
  closed: "Closed",
} as const;

function rulesFor(
  data: StateRuleData,
  state: StateCode,
  visa: StateVisa,
): StateVisaRules | undefined {
  return data.rules.rules.find((r) => r.state === state && r.visa === visa);
}

function statusText(
  status: StateVisaRules["streams"][number]["status"]["value"],
  programYear: string,
): string {
  if (status === "unknown") return CHECKING;
  if (status === "closed") return `Closed in ${programYear.replace("-", "–")}`;
  return STATUS_TEXT[status];
}

/** A stream's status and who it is for print only when our check verified them. */
export function streamRows(data: StateRuleData, state: StateCode): StreamRow[] {
  return STATE_VISAS.flatMap((visa) =>
    (rulesFor(data, state, visa)?.streams ?? []).map((stream) => {
      const verified =
        stream.status.verification === "verified" &&
        stream.cohorts.verification === "verified";
      return {
        visa,
        name: stream.name,
        status: verified
          ? statusText(stream.status.value, data.rules.programYear)
          : CHECKING,
        who: verified ? openTo(stream.cohorts.value, state) : CHECKING,
        checked: stream.status.checkedAt,
        verified,
      };
    }),
  );
}

export function selectionLines(
  data: StateRuleData,
  state: StateCode,
): SelectionLine[] {
  return STATE_VISAS.flatMap((visa) => {
    const rules = rulesFor(data, state, visa);
    if (!rules) return [];
    return [
      {
        visa,
        text: rules.selectionSystem.value,
        checked: rules.selectionSystem.checkedAt,
        verified: rules.selectionSystem.verification === "verified",
        scoreSystem: rules.ownScoreSystem?.value ?? null,
        resultsUrl: rules.resultsUrl ?? null,
      },
    ];
  });
}

/** The newest checked date among the state's rules and its imported lists. */
export function rulesCheckedAt(data: StateRuleData, state: StateCode): string {
  const dates: string[] = [];
  const listIds = new Set<string>();
  for (const visa of STATE_VISAS) {
    const rules = rulesFor(data, state, visa);
    if (!rules) continue;
    dates.push(rules.selectionSystem.checkedAt);
    if (rules.ownScoreSystem) dates.push(rules.ownScoreSystem.checkedAt);
    for (const stream of rules.streams) {
      dates.push(stream.status.checkedAt, stream.cohorts.checkedAt);
      const ref = stream.occupations.value;
      if (ref.kind === "list") listIds.add(ref.listId);
    }
  }
  for (const id of listIds) {
    const list = data.lists[id];
    if (list) dates.push(list.checkedAt);
  }
  if (dates.length === 0) throw new Error(`No 2026–27 rules for ${state}`);
  return dates.sort().at(-1) as string;
}

/** Codes on the state's imported list for the visa; null when no list is imported. */
export function importedListSize(
  data: StateRuleData,
  state: StateCode,
  visa: StateVisa,
): { count: number; checkedAt: string } | null {
  const streams = rulesFor(data, state, visa)?.streams ?? [];
  for (const stream of streams) {
    const ref = stream.occupations.value;
    const list = ref.kind === "list" ? data.lists[ref.listId] : undefined;
    if (!list) continue;
    const count = Object.values(list.entries).filter(
      (entry) => (entry[visa]?.length ?? 0) > 0,
    ).length;
    return { count, checkedAt: list.checkedAt };
  }
  return null;
}
