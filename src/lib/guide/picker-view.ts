import type { OccupationIndexEntry, StateVisa, Visa } from "../data/types";
import { occupationPath } from "../occupation-page/slug";
import { joinWords } from "../state-outlook/context";
import type { PathFit, PickerSituation } from "./path-fit";

export type VisaStamp = {
  visa: Visa;
  /** On or off the Home Affairs list; "unknown" when the list can't be read. */
  status: "on" | "off" | "unknown";
  text: string;
};

export type PickerView = {
  name: string;
  visas: VisaStamp[];
  /** One plain sentence per state visa: who lists it for the reader. */
  stateLines: string[];
  guideLinks: { href: string; text: string }[];
  occupationHref: string | null;
  checkHref: string;
};

const STATE_VISAS: StateVisa[] = ["190", "491"];

function readerText(situation: PickerSituation): string {
  return situation.kind === "offshore"
    ? "people outside Australia"
    : `people living in ${situation.state}`;
}

function stamp(visa: Visa, listed: boolean | null): VisaStamp {
  if (listed === null)
    return { visa, status: "unknown", text: "List unreadable" };
  return listed
    ? { visa, status: "on", text: "On the list" }
    : { visa, status: "off", text: "Not on the list" };
}

function stateLines(fit: PathFit, situation: PickerSituation): string[] {
  const reader = readerText(situation);
  const off = STATE_VISAS.filter((v) => fit.visas[v] === false);
  const lines = STATE_VISAS.filter((v) => fit.visas[v] !== false).map(
    (visa) => {
      const states = fit.openToYou[visa];
      if (states.length === 0)
        return `${visa}: no imported state list names it for ${reader}.`;
      const verb = states.length === 1 ? "lists" : "list";
      return `${visa}: ${joinWords(states, "and")} ${verb} it for ${reader}.`;
    },
  );
  if (off.length > 0) {
    lines.push(
      `${joinWords(off, "and")}: not on the Home Affairs list, so no state can nominate it.`,
    );
  }
  const checking = fit.states
    .filter((s) => STATE_VISAS.some((v) => s.byVisa[v].status === "checking"))
    .map((s) => s.state);
  if (checking.length > 0 && off.length < STATE_VISAS.length) {
    lines.push(
      `${joinWords(checking, "and")}: rules being checked, so see their official pages.`,
    );
  }
  return lines;
}

/** What the path picker shows for one occupation and situation. */
export function pickerView(
  fit: PathFit,
  entry: OccupationIndexEntry,
  situation: PickerSituation,
): PickerView {
  const visas = (["189", "190", "491"] as Visa[]).map((v) =>
    stamp(v, fit.visas[v]),
  );
  return {
    name: entry.name,
    visas,
    stateLines: stateLines(fit, situation),
    guideLinks: visas
      .filter((v) => v.status !== "off")
      .map((v) => ({ href: `/guide/${v.visa}/`, text: `The ${v.visa} guide` })),
    occupationHref: entry.hasData ? occupationPath(entry) : null,
    checkHref: `/check/?occupation=${entry.code}`,
  };
}
