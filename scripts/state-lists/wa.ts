import type {
  Cohort,
  ImportedList,
  ImportedListEntry,
} from "../../src/lib/state-outlook/rules-types";
import { fetchText, sortedEntries } from "./shared";

// The page's own CSV link returns an empty file; this form returns the data.
export const WA_LIST_URL =
  "https://migration.wa.gov.au/v2_occupation_search/occupation-search?combine=&_format=csv";

const COLUMNS = [
  "Occupation",
  "Industry Sector",
  "ANZSCO",
  "Stream",
  "Minimum Points",
  "Priority Occupation",
  "Regional WA only",
  "Status",
  "v190",
  "v491",
];

// In the order entries list them.
const STREAMS = [
  ["General - WASMOL Schedule 1", "schedule-1"],
  ["General - WASMOL Schedule 2", "schedule-2"],
  ["Defence Industry - WASMOL Schedule 3", "schedule-3"],
  ["Graduate", "graduate"],
] as const;

// The "Regional WA only" column is deliberately ignored: it limits where an
// applicant may settle, not whether the code is on the list.
// WA has no onshore/offshore split: residence affects ranking, not listing.
const ALL_COHORTS: Cohort[] = [
  "living-in-state",
  "living-in-other-state",
  "offshore",
];

/** Splits CSV text into rows, honouring quotes and CRLF line endings. */
function parseCsvRows(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let cell = "";
  let quoted = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (quoted) {
      if (c === '"' && text[i + 1] === '"') {
        cell += '"';
        i++;
      } else if (c === '"') quoted = false;
      else cell += c;
    } else if (c === '"') quoted = true;
    else if (c === ",") {
      row.push(cell);
      cell = "";
    } else if (c === "\n" || c === "\r") {
      if (c === "\r" && text[i + 1] === "\n") i++;
      row.push(cell);
      cell = "";
      if (row.some((value) => value !== "")) rows.push(row);
      row = [];
    } else cell += c;
  }
  row.push(cell);
  if (row.some((value) => value !== "")) rows.push(row);
  return rows;
}

function yesNo(value: string, code: string): boolean {
  if (value !== "Yes" && value !== "No") {
    throw new Error(`${code}: visa cell "${value}" is not Yes or No; review`);
  }
  return value === "Yes";
}

/**
 * Reads the CSV into entries by ANZSCO code. A visa is listed for all three
 * cohorts when any row of the code offers it. Each visa names only the lists
 * (streams) whose rows offer that visa.
 */
export function parseWaCsv(text: string): Record<string, ImportedListEntry> {
  const [header, ...rows] = parseCsvRows(text);
  if (!header || header.join("|") !== COLUMNS.join("|")) {
    throw new Error(
      `WA CSV column headings changed (got "${header?.join(",") ?? ""}"); review the source`,
    );
  }
  const offered: Record<string, { "190": boolean; "491": boolean }> = {};
  const lists: Record<string, { "190": Set<string>; "491": Set<string> }> = {};
  for (const cells of rows) {
    if (cells.length !== COLUMNS.length) {
      throw new Error(
        `WA CSV row has ${cells.length} cells, expected ${COLUMNS.length}; review the source`,
      );
    }
    const [, , code, stream, , , , status, v190, v491] = cells;
    if (!/^\d{6}$/.test(code)) {
      throw new Error(`WA CSV code "${code}" is not six digits; review`);
    }
    const id = STREAMS.find(([name]) => name === stream)?.[1];
    if (!id) throw new Error(`Unknown WA stream "${stream}"; review`);
    if (status !== "Available") {
      throw new Error(`${code}: status "${status}" is not Available; review`);
    }
    const seen = (offered[code] ??= { "190": false, "491": false });
    const offers190 = yesNo(v190, code);
    const offers491 = yesNo(v491, code);
    seen["190"] = seen["190"] || offers190;
    seen["491"] = seen["491"] || offers491;
    const tagged = (lists[code] ??= { "190": new Set(), "491": new Set() });
    if (offers190) tagged["190"].add(id);
    if (offers491) tagged["491"].add(id);
  }
  const entries: Record<string, ImportedListEntry> = {};
  for (const [code, seen] of Object.entries(offered)) {
    if (!seen["190"] && !seen["491"]) continue;
    const entry: ImportedListEntry = {};
    entry.streams = {};
    for (const visa of ["190", "491"] as const) {
      if (!seen[visa]) continue;
      entry[visa] = [...ALL_COHORTS];
      entry.streams[visa] = STREAMS.map(([, id]) => id).filter((id) =>
        lists[code][visa].has(id),
      );
    }
    entries[code] = entry;
  }
  return entries;
}

export function buildWaList(
  csv: string,
  meta: { source: string; checkedAt: string },
): ImportedList {
  return { listId: "wa", ...meta, entries: sortedEntries(parseWaCsv(csv)) };
}

export function fetchWaCsv(url = WA_LIST_URL): Promise<string> {
  return fetchText(url, "text/csv");
}
