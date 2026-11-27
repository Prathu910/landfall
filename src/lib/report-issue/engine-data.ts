import {
  isManifest,
  isOccupationCore,
  isOccupationDetail,
  isOccupationIndex,
} from "../data/guards";
import type {
  Manifest,
  OccupationCore,
  OccupationDetail,
  OccupationIndexEntry,
} from "../data/types";
import type { StateRuleData } from "../report/state-outlook-view";
import {
  isFederalList,
  isImportedList,
  isStateRules,
} from "../state-outlook/rules-guards";

/** Everything the server engine reads for one occupation, for the month it was handed. */
export type EngineData = {
  manifest: Manifest;
  index: OccupationIndexEntry[];
  rules: StateRuleData;
  core: OccupationCore;
  detail: OccupationDetail | null;
};

export type RawEngineData = { [K in keyof EngineData]: unknown };

const isObj = (v: unknown): v is Record<string, unknown> =>
  typeof v === "object" && v !== null && !Array.isArray(v);

/** The serialised state rule data (public/data/state-rules.json). */
function parseRules(v: unknown): StateRuleData | null {
  if (!isObj(v) || !isStateRules(v.rules) || !isObj(v.lists)) return null;
  const { lists, federal } = v;
  if (!Object.values(lists).every(isImportedList)) return null;
  if (federal !== null && !isFederalList(federal)) return null;
  return {
    rules: v.rules,
    lists: lists as StateRuleData["lists"],
    federal,
  };
}

/**
 * Validated engine data, or null when any part fails its guard. The files
 * come from the site at run time, so nothing is trusted unchecked; a detail
 * file for another occupation is refused too.
 */
export function parseEngineData(raw: RawEngineData): EngineData | null {
  const { manifest, index, core, detail } = raw;
  const rules = parseRules(raw.rules);
  if (!isManifest(manifest) || !isOccupationIndex(index) || !rules) {
    return null;
  }
  if (!isOccupationCore(core)) return null;
  if (detail !== null && !isOccupationDetail(detail)) return null;
  if (detail !== null && detail.code !== core.code) return null;
  return { manifest, index, rules, core, detail };
}
