import type { StateCode, StateVisa, Visa } from "../data/types";
import type { OutlookInput, ProfileOutlook } from "./evaluate-profile";
import { isOffList, stampName189 } from "./label-189";
import { stampName } from "./labels";
import type { OutlookLabel } from "./labels";
import { namedState, stateVisaOf } from "./phrases";

/** What a stamp shows before any caption: the free result's whole visa row. */
export type FreeStamp = {
  visa: Visa;
  shape: "rect" | "hex" | "oval";
  top: string;
  stampWord: string;
  points: number;
  label: OutlookLabel;
  /** The label whose colours the stamp takes: neutral for an unavailable 189. */
  ink: OutlookLabel;
};

const ANY_STATE = "ANY STATE";
const SHAPES: Record<Visa, FreeStamp["shape"]> = {
  "189": "rect",
  "190": "hex",
  "491": "oval",
};

/** States whose lists hold the occupation, when there is no evidence to label it. */
export function listedBy(
  o: ProfileOutlook,
  visa: StateVisa,
  label: OutlookLabel,
): StateCode[] {
  const federal = visa === "190" ? "federal190" : "federal491";
  if (label !== "no-data" || !o.listMembership[federal]) return [];
  return o.listMembership.states;
}

/** Ruling R16: a state named from its list says so ("On WA list"). */
function listTop(
  visa: StateVisa,
  states: StateCode[],
): Pick<FreeStamp, "top" | "stampWord"> {
  const one = states.length === 1;
  return {
    top: one ? `${visa} ${states[0]}` : `${visa} ${ANY_STATE}`,
    stampWord: one ? `On ${states[0]} list` : `On ${states.length} state lists`,
  };
}

function stateFace(o: ProfileOutlook, visa: StateVisa): FreeStamp {
  const visaLabel = stateVisaOf(o, visa);
  const label = visaLabel?.label ?? "no-data";
  // Ruling R7: only a state with invitation evidence is named.
  const named = namedState(visaLabel);
  const listed = listedBy(o, visa, label);
  let text: Pick<FreeStamp, "top" | "stampWord">;
  if (named) {
    text = { top: `${visa} ${named.state}`, stampWord: stampName(label) };
  } else if (listed.length > 0) {
    text = listTop(visa, listed);
  } else {
    text = { top: `${visa} ${ANY_STATE}`, stampWord: stampName(label) };
  }
  return {
    visa,
    shape: SHAPES[visa],
    ...text,
    points: visa === "190" ? o.points.subclass190 : o.points.subclass491,
    label,
    ink: label,
  };
}

function face189(o: ProfileOutlook): FreeStamp {
  const { v189 } = o;
  return {
    visa: "189",
    shape: SHAPES["189"],
    top: `189 ${ANY_STATE}`,
    stampWord: stampName189(v189),
    points: o.points.base,
    label: v189.label,
    // Neutral, like the "Not available" stamp on the occupation page.
    ink: isOffList(v189) ? "no-data" : v189.label,
  };
}

/** One visa's stamp, from the evaluated profile alone. */
export function stampFace(
  _input: OutlookInput,
  o: ProfileOutlook,
  visa: Visa,
): FreeStamp {
  return visa === "189" ? face189(o) : stateFace(o, visa);
}
