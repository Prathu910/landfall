import { stateRules } from "../../data/state-rules/2026-27/index";
import federalJson from "../../data/state-rules/federal-occupations.json";
import nswJson from "../../data/state-rules/lists/nsw.json";
import qldJson from "../../data/state-rules/lists/qld.json";
import saJson from "../../data/state-rules/lists/sa.json";
import waJson from "../../data/state-rules/lists/wa.json";
import type { StateRuleData } from "../../lib/report/state-outlook-view";
import {
  isFederalList,
  isImportedList,
} from "../../lib/state-outlook/rules-guards";
import type { ImportedList } from "../../lib/state-outlook/rules-types";

// Small enough (about 12 KB gzipped together) for the client to import whole.
const LISTS: Record<string, unknown> = {
  nsw: nswJson,
  qld: qldJson,
  sa: saJson,
  wa: waJson,
};

/** Lists that fail validation are left out, so their rules read "Not yet verified". */
function validLists(): Record<string, ImportedList> {
  const lists: Record<string, ImportedList> = {};
  for (const [id, json] of Object.entries(LISTS)) {
    if (isImportedList(json)) lists[id] = json;
  }
  return lists;
}

/**
 * The 2026–27 state rules, imported lists and federal list: the state rule
 * data a client component may import. An unreadable federal list is null,
 * which makes every tile "Not yet verified".
 */
export const stateRuleData: StateRuleData = {
  rules: stateRules,
  lists: validLists(),
  federal: isFederalList(federalJson) ? federalJson : null,
};
