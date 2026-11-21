import type { StateCode, StateVisa } from "../data/types";
import type { OutlookInput, ProfileOutlook } from "./evaluate-profile";
import type { Improve } from "./improve";
import type { StateLabel } from "./label-state";
import { LABEL_RANK, isAtLeast } from "./labels";
import { namedState, stateVisaOf } from "./phrases";

/** A stamp on a state visa, which always names its state. */
export type Stamped = { visa: StateVisa; state: StateCode; points: number };

/** What the hero reads from; built once so each line agrees with the others. */
export type HeadlineCtx = {
  input: OutlookInput;
  o: ProfileOutlook;
  improve: Improve;
  name: string;
  lodged: boolean;
  stamped: Stamped | null;
};

const VISAS: StateVisa[] = ["190", "491"];

export function capital(text: string): string {
  return text[0].toUpperCase() + text.slice(1);
}

/** State visas that name a state and are competitive or better, best first; 190 wins a tie. */
export function suitedStates(o: ProfileOutlook): StateLabel[] {
  const suited = VISAS.flatMap((visa) => {
    const state = namedState(stateVisaOf(o, visa));
    return state && isAtLeast(state.label, "competitive") ? [state] : [];
  });
  const rank = (s: StateLabel) => LABEL_RANK.indexOf(s.label);
  return suited.sort((a, b) => rank(a) - rank(b));
}

export function stampedState(o: ProfileOutlook): Stamped | null {
  const { stamp } = o;
  // Same test as situationOf, spelled out so TypeScript narrows the stamp.
  if (stamp.kind !== "single" || stamp.visa === "189" || !stamp.state) {
    return null;
  }
  return { visa: stamp.visa, state: stamp.state, points: stamp.points };
}
