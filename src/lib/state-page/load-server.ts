/**
 * SERVER ONLY. Reads the data files with node `fs` (through the data and
 * updates loaders); import only from Server Components, the sitemap and
 * `generateStaticParams`.
 */
import occupationIndex from "../../data/occupation-index.json";
import { stateRuleData } from "../../components/data/state-rule-data";
import { statePrograms } from "../../data/states";
import {
  loadManifest,
  loadOccupationCore,
  loadRounds,
} from "../data/load-server";
import type {
  OccupationCore,
  OccupationIndexEntry,
  StateCode,
} from "../data/types";
import { stateFigures } from "../updates/facts-states";
import { listRecapMonths } from "../updates/load-server";
import { currentCores } from "./series";
import { STATE_PAGES } from "./slug";
import { buildStatePageView, type StatePageView } from "./view";

const INDEX: OccupationIndexEntry[] = occupationIndex;

let views: Map<StateCode, StatePageView> | null = null;

/** Occupations that dropped out of the data: they count only towards last month's floors. */
function droppedCores(): OccupationCore[] {
  return INDEX.filter((entry) => entry.lastAsAt !== undefined).flatMap(
    (entry) => loadOccupationCore(entry.code) ?? [],
  );
}

function buildAll(): Map<StateCode, StatePageView> {
  const manifest = loadManifest();
  const cores = currentCores(INDEX, loadOccupationCore, manifest.asAt);
  const shared = {
    cores,
    manifest,
    rounds: loadRounds(),
    ruleData: stateRuleData,
    programs: statePrograms,
    occupationPages: new Set(INDEX.filter((e) => e.hasData).map((e) => e.code)),
    recapMonths: listRecapMonths(),
    allStates: stateFigures(cores, manifest.asAt, droppedCores()),
  };
  return new Map(
    STATE_PAGES.map(({ code }) => [
      code,
      buildStatePageView({ ...shared, state: code }),
    ]),
  );
}

/** The eight state page views, built once per process (each reads all 493 cores). */
export function loadStatePageViews(): StatePageView[] {
  views ??= buildAll();
  return [...views.values()];
}

export function loadStatePageView(code: StateCode): StatePageView {
  views ??= buildAll();
  const view = views.get(code);
  if (!view) throw new Error(`No state page view for ${code}`);
  return view;
}
