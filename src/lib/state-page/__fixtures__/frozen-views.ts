import { stateRuleData } from "../../../components/data/state-rule-data";
import { statePrograms } from "../../../data/states";
import {
  frozenCores,
  frozenIndex,
  frozenManifest,
} from "../../data/__fixtures__/frozen-2026-10";
import type { StateCode } from "../../data/types";
import { rounds } from "../../updates/__fixtures__/data-2026-10";
import { stateFigures } from "../../updates/facts-states";
import { currentCores } from "../series";
import { STATE_PAGES } from "../slug";
import { buildStatePageView, type StatePageView } from "../view";

/** Test-only: the eight state views on the frozen 2026-10 snapshot. */
let cached: Map<StateCode, StatePageView> | undefined;

export function frozenStateViews(): Map<StateCode, StatePageView> {
  if (cached) return cached;
  const manifest = frozenManifest();
  const byCode = new Map(frozenCores().map((core) => [core.code, core]));
  const index = frozenIndex();
  const cores = currentCores(
    index,
    (code) => byCode.get(code) ?? null,
    manifest.asAt,
  );
  const shared = {
    cores,
    manifest,
    rounds,
    ruleData: stateRuleData,
    programs: statePrograms,
    occupationPages: new Set(index.filter((e) => e.hasData).map((e) => e.code)),
    recapMonths: ["2026-10"],
    allStates: stateFigures(cores, manifest.asAt),
  };
  cached = new Map(
    STATE_PAGES.map(({ code }) => [
      code,
      buildStatePageView({ ...shared, state: code }),
    ]),
  );
  return cached;
}

export const frozenView = (code: StateCode): StatePageView => {
  const view = frozenStateViews().get(code);
  if (!view) throw new Error(code);
  return view;
};
