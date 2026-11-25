import type {
  NominationsTable,
  RoundTotal,
  SkippedRound,
} from "../../src/lib/data/rounds-file";
import {
  decodeEntities,
  expandSpans,
  extractTables,
  indexesWhere,
  parseLongDate,
  texts,
  type Table,
} from "./html-tables";
import {
  firstVisaTable,
  parseNominations,
  parseTieBreak,
  parseTotals,
  TIE_BREAK_COLUMN,
  type TieBreakMisprint,
} from "./round-tables";

export { decodeEntities } from "./html-tables";
export type { SkippedRound } from "../../src/lib/data/rounds-file";
export type { TieBreakMisprint } from "./round-tables";

export type ParsedRow = {
  occupationName: string;
  cutoff: number;
  tieBreak: string | null; // YYYY-MM-DD
  /** Present only on rows read back from rounds.json: the stored match. */
  code?: string | null;
};

export type ParsedRound = {
  date: string;
  totals: RoundTotal[] | null;
  tieBreak: string | null; // the totals table's 189 tie-break date
  rows: ParsedRow[];
  nominations: NominationsTable | null; // current-round page only
};

const BASE =
  "https://immi.homeaffairs.gov.au/visas/working-in-australia/skillselect/";
export const CURRENT_ROUNDS_URL = `${BASE}invitation-rounds`;
export const PREVIOUS_ROUNDS_URL = `${BASE}previous-rounds`;
const SCHEMA_INPUT_ID = "ctl00_PlaceHolderMain_PageSchemaHiddenField_Input";

export function normalizeOccupationName(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9]/g, "");
}

function readSchema(html: string): Record<string, unknown> {
  const tag = new RegExp(`<input[^>]*id="${SCHEMA_INPUT_ID}"[^>]*>`, "i").exec(
    html,
  );
  const value = tag && /\svalue="([^"]*)"/i.exec(tag[0]);
  if (!value) {
    throw new Error(
      "Official page schema changed; review the source before importing",
    );
  }
  return JSON.parse(decodeEntities(value[1])) as Record<string, unknown>;
}

function stringField(item: unknown, key: string): string {
  const value = (item as Record<string, unknown> | null)?.[key];
  if (typeof value !== "string") {
    throw new Error(`Round page field "${key}" missing; review the source`);
  }
  return value;
}

function arrayField(schema: Record<string, unknown>, key: string): unknown[] {
  const value = schema[key];
  if (!Array.isArray(value)) {
    throw new Error(`Round page schema has no "${key}" list`);
  }
  return value;
}

const NOT_LISTED = /^(n\/?a\b|not invited|$)/i;
/** A header naming subclass 189 alone, e.g. "189", "Subclass 189* Minimum scored". */
const SUBCLASS_189 =
  /^(?:lowest points score invited )?(?:subclass )?189(?![\d/])/i;
const ANY_SUBCLASS = /\b(?:189|190|491)\b/;
const MINIMUM_POINTS = /^minimum points score$/i;
/** 2020-21 rounds list 4-digit unit groups: "Subclass | Occupation ID | Description". */
const UNIT_GROUP_COLUMN = /^occupation id$/i;

type BlockResult =
  { round: ParsedRound; misprints: TieBreakMisprint[] } | { reason: string };

/**
 * True when the round's own totals table (the first "Visa subclass" table;
 * later ones cover the programme year) lists subclass 189 alone.
 */
function listsOnly189(tables: Table[]): boolean {
  const visas = (firstVisaTable(tables) ?? [])
    .slice(1)
    .map((row) => row[0]?.text ?? "")
    .filter((text) => text !== "");
  return (
    visas.length > 0 && visas.every((visa) => /\(subclass 189\)/i.test(visa))
  );
}

// Finds the 189 data columns. A column must name subclass 189 explicitly,
// either in its own header or in a group label above it (2022-23 layouts put
// 189 / 491 above an offshore/onshore row; the group cells carry colspans).
// The current-round page lists 189 only, under "Minimum points score".
function cutoffColumns(
  table: Table,
  headerRow: number,
  only189: boolean,
): number[] {
  const header = texts(table[headerRow]);
  const explicit = indexesWhere(
    header,
    (text, index) => index > 0 && SUBCLASS_189.test(text),
  );
  if (explicit.length > 0) return explicit;
  if (headerRow > 0) {
    const groups = expandSpans(table[0]);
    if (groups.length !== header.length) {
      throw new Error(
        `Round group header spans ${groups.length} columns but the table has ${header.length}`,
      );
    }
    const grouped = indexesWhere(
      groups,
      (text, index) => index > 0 && SUBCLASS_189.test(text),
    );
    if (grouped.length > 0) return grouped;
  }
  if (only189 && !header.some((text) => ANY_SUBCLASS.test(text))) {
    const minimum = indexesWhere(header, (text) => MINIMUM_POINTS.test(text));
    if (minimum.length === 1) return minimum;
  }
  throw new Error(
    `Occupation table has no explicit 189 column: ${JSON.stringify(header)}`,
  );
}

function findOccupationTable(
  tables: Table[],
): { table: Table; headerRow: number } | undefined {
  for (const table of tables) {
    const headerRow = table
      .slice(0, 2)
      .findIndex((row) => row.some((cell) => /occupation/i.test(cell.text)));
    if (headerRow >= 0) return { table, headerRow };
  }
  return undefined;
}

export function parseRoundBlock(date: string, block: string): BlockResult {
  const tables = extractTables(block);
  const found = findOccupationTable(tables);
  if (!found) return { reason: "no table with an Occupation column" };
  const { table, headerRow } = found;
  const header = texts(table[headerRow]);
  if (header.some((text) => UNIT_GROUP_COLUMN.test(text))) {
    return {
      reason:
        "unit-group layout (Subclass | Occupation ID | Description): its cut-offs cover a 4-digit occupation group and cannot be attributed to one 6-digit occupation",
    };
  }
  const nameColumn = header.findIndex((text) => /occupation/i.test(text));
  const tieColumn = header.findIndex((text) => TIE_BREAK_COLUMN.test(text));
  const columns = cutoffColumns(table, headerRow, listsOnly189(tables));
  const rows: ParsedRow[] = [];
  const misprints: TieBreakMisprint[] = [];
  for (const cells of table.slice(headerRow + 1).map(texts)) {
    if (cells.length === 0) continue;
    const occupationName = cells[nameColumn];
    const values: number[] = [];
    for (const column of columns) {
      const text = cells[column] ?? "";
      // "N/A*" / "Not invited" mean no 189 invitations: "not listed", never zero.
      if (NOT_LISTED.test(text)) continue;
      if (!occupationName || !/^\d+$/.test(text)) {
        throw new Error(
          `Unexpected 189 cut-off for ${occupationName || "?"} on ${date}: ${text}`,
        );
      }
      values.push(Number(text));
    }
    // Offshore/onshore columns: the lowest score invited is the cut-off.
    if (values.length > 0) {
      const tieBreak =
        tieColumn < 0
          ? null
          : parseTieBreak(
              cells[tieColumn] ?? "",
              date,
              occupationName,
              misprints,
            );
      rows.push({ occupationName, cutoff: Math.min(...values), tieBreak });
    }
  }
  const totals = parseTotals(date, tables, misprints);
  return { round: { date, ...totals, rows, nominations: null }, misprints };
}

export type RoundPages = { rounds: ParsedRound[]; skipped: SkippedRound[] };
/** Freshly parsed pages, plus each misprinted tie-break (stored as no date). */
export type ParsedPages = RoundPages & { misprints: TieBreakMisprint[] };

function contentBlock(schema: Record<string, unknown>, text: string) {
  const item = arrayField(schema, "content").find(
    (entry) => stringField(entry, "text") === text,
  );
  return item === undefined ? undefined : stringField(item, "block");
}

/**
 * The current invitation rounds page: its round, with the "State and
 * Territory nominations" table (null when the page has no such block).
 */
export function parseCurrentRound(currentHtml: string): ParsedRound {
  return readCurrentRound(currentHtml).round;
}

/** The "Current round" block and the date its invitations were issued. */
function currentRoundBlock(schema: Record<string, unknown>): {
  date: string;
  block: string;
} {
  const block = contentBlock(schema, "Current round");
  if (block === undefined) throw new Error("Current round block missing");
  const issued = /Invitations issued on (\d+ \w+ \d{4})/.exec(block);
  if (!issued) throw new Error("Current round date missing");
  return { date: parseLongDate(issued[1]), block };
}

/**
 * The current round's date (YYYY-MM-DD), read without parsing its tables, so
 * the round job's daily check needs the current page only.
 */
export function newestRoundDate(currentHtml: string): string {
  return currentRoundBlock(readSchema(currentHtml)).date;
}

function readCurrentRound(currentHtml: string): {
  round: ParsedRound;
  misprints: TieBreakMisprint[];
} {
  const schema = readSchema(currentHtml);
  const { date, block } = currentRoundBlock(schema);
  const newest = parseRoundBlock(date, block);
  if (!("round" in newest)) {
    throw new Error(`Current round unreadable: ${newest.reason}`);
  }
  const nominations = contentBlock(schema, "State and Territory nominations");
  return {
    round: {
      ...newest.round,
      nominations:
        nominations === undefined ? null : parseNominations(nominations),
    },
    misprints: newest.misprints,
  };
}

export function parseRoundPagesDetailed(
  currentHtml: string,
  previousHtml: string,
): ParsedPages {
  const current = readCurrentRound(currentHtml);
  const rounds = [current.round];
  const misprints = [...current.misprints];
  const skipped: SkippedRound[] = [];
  for (const item of arrayField(readSchema(previousHtml), "criteria")) {
    const date = parseLongDate(stringField(item, "title"));
    const result = parseRoundBlock(date, stringField(item, "description"));
    if ("round" in result) {
      rounds.push(result.round);
      misprints.push(...result.misprints);
    } else skipped.push({ date, reason: result.reason });
  }
  rounds.sort((a, b) => b.date.localeCompare(a.date));
  return { rounds, skipped, misprints };
}

/**
 * The parsed rounds dated after the newest stored round, oldest first: the
 * rounds a round import adds. An older round missing from the stored file is
 * not a new round. Takes a RoundsFile or rounds read back from one.
 */
export function newRoundDates(
  stored: { rounds: readonly { date: string }[] },
  parsed: RoundPages,
): string[] {
  // YYYY-MM-DD strings compare in calendar order.
  const newest = stored.rounds.reduce(
    (max, round) => (round.date > max ? round.date : max),
    "",
  );
  return parsed.rounds
    .map((round) => round.date)
    .filter((date) => date > newest)
    .sort();
}

export function parseRoundPages(
  currentHtml: string,
  previousHtml: string,
): ParsedRound[] {
  return parseRoundPagesDetailed(currentHtml, previousHtml).rounds;
}

/** Fetches one official round page's HTML. */
export async function fetchRoundPage(url: string): Promise<string> {
  const response = await fetch(url, {
    headers: { "User-Agent": "Mozilla/5.0" },
    signal: AbortSignal.timeout(40_000),
  });
  if (!response.ok) {
    throw new Error(`${url} returned HTTP ${response.status}`);
  }
  return response.text();
}

export async function fetchRoundPages(): Promise<{
  currentHtml: string;
  previousHtml: string;
}> {
  const [currentHtml, previousHtml] = await Promise.all([
    fetchRoundPage(CURRENT_ROUNDS_URL),
    fetchRoundPage(PREVIOUS_ROUNDS_URL),
  ]);
  return { currentHtml, previousHtml };
}
