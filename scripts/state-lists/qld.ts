import type {
  Cohort,
  ImportedList,
  ImportedListEntry,
} from "../../src/lib/state-outlook/rules-types";
import { tablesOf } from "./html-table";
import { fetchText, sortedEntries } from "./shared";

export const QLD_ONSHORE_URL =
  "https://www.migration.qld.gov.au/occupation-lists/queensland-onshore-skilled-occupation-list";
export const QLD_OFFSHORE_URL =
  "https://www.migration.qld.gov.au/occupation-lists/offshore-queensland-skilled-occupation-lists-(qsol)";

/** What one table row offers, before the page's cohort is applied. */
type Row = { "190": boolean; "491": boolean; pathways: string[] };

const BUILDING_AND_CONSTRUCTION = "building-and-construction";

function tickOf(cell: string, code: string): boolean {
  if (cell === "tick") return true;
  if (cell === "") return false;
  throw new Error(`${code}: visa cell "${cell}" is not a tick; review`);
}

function checkHeadings(headings: string[]): void {
  const [code, name, v491, v190] = headings;
  const ok =
    headings.length >= 4 &&
    /^ANZSCO/.test(code) &&
    /^Occupation/.test(name) &&
    v491.includes("491") &&
    v190.includes("190");
  if (!ok) {
    throw new Error(
      `QLD table headings changed (got "${headings.join(" | ")}"); review the source`,
    );
  }
}

/**
 * Reads one Queensland list table into rows by ANZSCO code. A code the table
 * lists twice gets the union of its rows. A row with no visa ticked throws,
 * because the page lists only occupations it offers.
 */
export function parseQldTable(html: string): Record<string, Row> {
  const [table] = tablesOf(html);
  if (!table) throw new Error("QLD list table not found; review the source");
  const [headings, ...rows] = table;
  checkHeadings(headings);
  const hasPathway = /Building and Construction/i.test(headings[4] ?? "");
  const found: Record<string, Row> = {};
  for (const cells of rows) {
    const code = cells[0] ?? "";
    if (!/^\d{6}$/.test(code)) {
      throw new Error(`QLD code "${code}" is not six digits; review`);
    }
    if (cells.length < 4) {
      throw new Error(`${code}: row has ${cells.length} cells; review`);
    }
    const v491 = tickOf(cells[2], code);
    const v190 = tickOf(cells[3], code);
    if (!v491 && !v190) {
      throw new Error(`${code}: listed but no visa ticked; review the source`);
    }
    const pathway = hasPathway && tickOf(cells[4] ?? "", code);
    const row = (found[code] ??= { "190": false, "491": false, pathways: [] });
    row["190"] = row["190"] || v190;
    row["491"] = row["491"] || v491;
    if (pathway && !row.pathways.includes(BUILDING_AND_CONSTRUCTION)) {
      row.pathways.push(BUILDING_AND_CONSTRUCTION);
    }
  }
  return found;
}

const PAGES: { stream: string; cohort: Cohort }[] = [
  { stream: "onshore", cohort: "living-in-state" },
  { stream: "offshore", cohort: "offshore" },
];
const COHORT_ORDER: Cohort[] = [
  "living-in-state",
  "living-in-other-state",
  "offshore",
];

/**
 * Combines the onshore and offshore lists. The onshore list gives the
 * living-in-state cohort and the offshore list the offshore cohort; who may
 * use which belongs to the curated rules.
 */
export function buildQldList(
  onshoreHtml: string,
  offshoreHtml: string,
  meta: { source: string; checkedAt: string },
): { list: ImportedList; counts: { onshore: number; offshore: number } } {
  const parsed = [parseQldTable(onshoreHtml), parseQldTable(offshoreHtml)];
  const cohorts: Record<string, Record<"190" | "491", Set<Cohort>>> = {};
  const streams: Record<string, Set<string>> = {};
  const pathways: Record<string, Set<string>> = {};
  parsed.forEach((rows, i) => {
    const { stream, cohort } = PAGES[i];
    for (const [code, row] of Object.entries(rows)) {
      const seen = (cohorts[code] ??= { "190": new Set(), "491": new Set() });
      if (row["190"]) seen["190"].add(cohort);
      if (row["491"]) seen["491"].add(cohort);
      (streams[code] ??= new Set()).add(stream);
      pathways[code] ??= new Set();
      row.pathways.forEach((p) => pathways[code].add(p));
    }
  });
  const entries: Record<string, ImportedListEntry> = {};
  for (const [code, seen] of Object.entries(cohorts)) {
    const entry: ImportedListEntry = {};
    for (const visa of ["190", "491"] as const) {
      const list = COHORT_ORDER.filter((c) => seen[visa].has(c));
      if (list.length > 0) entry[visa] = list;
    }
    entry.streams = [
      ...PAGES.map((p) => p.stream).filter((s) => streams[code].has(s)),
      ...pathways[code],
    ];
    entries[code] = entry;
  }
  return {
    list: { listId: "qld", ...meta, entries: sortedEntries(entries) },
    counts: {
      onshore: Object.keys(parsed[0]).length,
      offshore: Object.keys(parsed[1]).length,
    },
  };
}

export function fetchQldPage(url: string): Promise<string> {
  return fetchText(url, "text/html");
}
