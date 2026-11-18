import type {
  Cohort,
  ImportedList,
  ImportedListEntry,
} from "../../src/lib/state-outlook/rules-types";
import { tablesOf } from "./html-table";
import { fetchText, sortedEntries } from "./shared";

export const NSW_LIST_URL =
  "https://www.nsw.gov.au/visas-and-migration/skilled-visas/nsw-skills-lists";

// NSW's residence rules limit who may be nominated, not whether the unit group
// is listed, so the list applies to every cohort. The page lists 190 only.
const ALL_COHORTS: Cohort[] = [
  "living-in-state",
  "living-in-other-state",
  "offshore",
];

/** The four-digit unit groups the Skills List table names, in page order. */
export function parseNswUnitGroups(html: string): string[] {
  const table = tablesOf(html).find(
    ([heading]) =>
      heading?.[0] === "ANZSCO Code" && heading[1] === "Unit Group Name",
  );
  if (!table) {
    throw new Error("NSW unit group table not found; review the source");
  }
  const groups: string[] = [];
  for (const [code] of table.slice(1)) {
    if (!/^\d{4}$/.test(code ?? "")) {
      throw new Error(`NSW unit group "${code}" is not four digits; review`);
    }
    if (!groups.includes(code)) groups.push(code);
  }
  return groups;
}

/**
 * Maps each unit group to every indexed six-digit code with that prefix. A
 * unit group that matches no indexed code is returned in `unmatched`, not
 * guessed at.
 */
export function buildNswList(
  html: string,
  index: { code: string }[],
  meta: { source: string; checkedAt: string },
): { list: ImportedList; unitGroups: number; unmatched: string[] } {
  const groups = parseNswUnitGroups(html);
  const entries: Record<string, ImportedListEntry> = {};
  const unmatched: string[] = [];
  for (const group of groups) {
    const codes = index.map((o) => o.code).filter((c) => c.startsWith(group));
    if (codes.length === 0) unmatched.push(group);
    for (const code of codes) {
      entries[code] = {
        "190": [...ALL_COHORTS],
        streams: { "190": ["nsw-skills-list"] },
        viaUnitGroup: group,
      };
    }
  }
  return {
    list: { listId: "nsw", ...meta, entries: sortedEntries(entries) },
    unitGroups: groups.length,
    unmatched,
  };
}

export function fetchNswPage(url = NSW_LIST_URL): Promise<string> {
  return fetchText(url, "text/html");
}
