import { stateRules } from "../../../data/state-rules/2026-27/index";
import {
  frozenCore,
  frozenDetail,
} from "../../data/__fixtures__/frozen-2026-10";
import {
  realFederal,
  realLists,
} from "../../state-outlook/__fixtures__/real-data";
import type { OutlookInput } from "../evaluate-profile";
import { SCENARIOS } from "./scenarios";
import type { ScenarioId } from "./scenarios";

export const AS_OF = "2026-11-21";

const RULES = {
  rules: stateRules,
  lists: realLists(),
  federal: realFederal(),
};

/**
 * Real-data input for a scenario. Sana's occupation has no published data,
 * so the client never fetches it; she takes the no-core product path.
 */
export function scenarioInput(id: ScenarioId): OutlookInput {
  const profile = SCENARIOS[id];
  const fetched = id !== "nodata";
  return {
    profile,
    asOf: AS_OF,
    core: fetched ? frozenCore(profile.occupation) : null,
    detail: fetched ? frozenDetail(profile.occupation) : null,
    rules: RULES,
  };
}
