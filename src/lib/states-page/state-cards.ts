import type { StateProgram } from "../../data/states";
import type { StateCode, StateVisa } from "../data/types";
import { formatDate } from "../migration";
import { STATE_ORDER, openTo } from "../occupation-page/states";
import type { StateRuleData } from "../report/state-outlook-view";
import type { Cohort, Stream } from "../state-outlook/rules-types";

/**
 * The /states/ page's summary of each state and territory: the hand-sourced
 * program summary (src/data/states.ts) beside what the 2026–27 rule data
 * says about each visa and its occupation list.
 */

export type VisaLine =
  | { status: "open" | "restricted"; label: string; who: string }
  | { status: "closed" | "checking"; label: string; who: null };

export type StateVisaSummary = { visa: StateVisa; lines: VisaLine[] };

export type StateCard = {
  code: StateCode;
  anchor: string;
  name: string;
  system: string;
  visas: StateVisaSummary[];
  occupationList: { checked: boolean; text: string };
  summary: string;
  considerations: string;
  url: string;
  checked: string;
};

const VISAS: StateVisa[] = ["190", "491"];
// Our check of the official rules, not the reader: the occupation pages and
// report use the same words (ruling in STRATEGY, 19 Nov 2026).
const CHECKING: VisaLine = {
  status: "checking",
  label: "Rules being checked",
  who: null,
};

function isVerified(stream: Stream): boolean {
  return (
    stream.status.verification === "verified" &&
    stream.cohorts.verification === "verified"
  );
}

function cohortsWith(streams: Stream[], status: Stream["status"]["value"]) {
  const cohorts = new Set<Cohort>();
  for (const stream of streams) {
    if (stream.status.value === status) {
      stream.cohorts.value.forEach((c) => cohorts.add(c));
    }
  }
  return [...cohorts];
}

/**
 * Only verified streams speak. "Closed" needs every stream verified closed,
 * since an unverified stream could still be open.
 */
export function visaLines(
  streams: Stream[],
  state: StateCode,
  programYear: string,
): VisaLine[] {
  const verified = streams.filter(isVerified);
  const lines: VisaLine[] = [];
  const open = cohortsWith(verified, "open");
  if (open.length) {
    lines.push({ status: "open", label: "Open", who: openTo(open, state) });
  }
  const restricted = cohortsWith(verified, "restricted");
  if (restricted.length) {
    lines.push({
      status: "restricted",
      label: "Open with restrictions",
      who: openTo(restricted, state),
    });
  }
  if (lines.length) return lines;
  const allClosed =
    streams.length > 0 &&
    streams.every((s) => isVerified(s) && s.status.value === "closed");
  if (!allClosed) return [CHECKING];
  const year = programYear.replace("-", "–");
  return [{ status: "closed", label: `Closed in ${year}`, who: null }];
}

function occupationList(
  streams: Stream[],
  data: StateRuleData,
): StateCard["occupationList"] {
  for (const stream of streams) {
    const ref = stream.occupations.value;
    const list = ref.kind === "list" ? data.lists[ref.listId] : undefined;
    if (list) {
      const year = data.rules.programYear.replace("-", "–");
      return {
        checked: true,
        text: `${year} list imported, checked ${formatDate(list.checkedAt)}`,
      };
    }
  }
  return { checked: false, text: CHECKING.label };
}

/** "17 Nov 2026" reads as a date line; a longer review note stands as it is. */
function checkedLine(checked: string): string {
  return /^\d/.test(checked) ? `Summary checked ${checked}` : checked;
}

export function buildStateCards(
  programs: StateProgram[],
  data: StateRuleData,
): StateCard[] {
  const byCode = new Map(programs.map((p) => [p.code, p]));
  return STATE_ORDER.flatMap((code) => {
    const program = byCode.get(code);
    if (!program) return [];
    const streamsOf = (visa: StateVisa) =>
      data.rules.rules.find((r) => r.state === code && r.visa === visa)
        ?.streams ?? [];
    return [
      {
        code,
        anchor: code.toLowerCase(),
        name: program.name,
        system: program.system,
        visas: VISAS.map((visa) => ({
          visa,
          lines: visaLines(streamsOf(visa), code, data.rules.programYear),
        })),
        occupationList: occupationList(VISAS.flatMap(streamsOf), data),
        summary: program.summary,
        considerations: program.considerations,
        url: program.url,
        checked: checkedLine(program.checked),
      },
    ];
  });
}
