export type ParsedRound = {
  date: string;
  rows: { occupationName: string; cutoff: number }[];
};

const BASE =
  "https://immi.homeaffairs.gov.au/visas/working-in-australia/skillselect/";
export const CURRENT_ROUNDS_URL = `${BASE}invitation-rounds`;
export const PREVIOUS_ROUNDS_URL = `${BASE}previous-rounds`;
const SCHEMA_INPUT_ID = "ctl00_PlaceHolderMain_PageSchemaHiddenField_Input";

const MONTHS = [
  "january",
  "february",
  "march",
  "april",
  "may",
  "june",
  "july",
  "august",
  "september",
  "october",
  "november",
  "december",
];

const NAMED_ENTITIES: Record<string, string> = {
  amp: "&",
  lt: "<",
  gt: ">",
  quot: '"',
  apos: "'",
  nbsp: " ",
};

function decodeEntities(text: string): string {
  return text.replace(
    /&(#x[0-9a-f]+|#\d+|[a-z]+);/gi,
    (whole, body: string) => {
      if (body[0] === "#") {
        const code =
          body[1] === "x" || body[1] === "X"
            ? parseInt(body.slice(2), 16)
            : parseInt(body.slice(1), 10);
        return String.fromCodePoint(code);
      }
      return NAMED_ENTITIES[body.toLowerCase()] ?? whole;
    },
  );
}

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

function parseLongDate(text: string): string {
  const match = /^(\d{1,2}) ([A-Za-z]+) (\d{4})$/.exec(text.trim());
  const month = match ? MONTHS.indexOf(match[2].toLowerCase()) : -1;
  if (!match || month < 0) throw new Error(`Unrecognised round date "${text}"`);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${match[3]}-${pad(month + 1)}-${pad(Number(match[1]))}`;
}

function cellText(html: string): string {
  return decodeEntities(html.replace(/<[^>]*>/g, " "))
    .replace(/\s+/g, " ")
    .trim();
}

type Cell = { text: string; span: number };
type Table = Cell[][];

function readCell(html: string): Cell {
  const colspan = /^<t[dh][^>]*\scolspan="?(\d+)/i.exec(html);
  return { text: cellText(html), span: colspan ? Number(colspan[1]) : 1 };
}

function extractTables(html: string): Table[] {
  return (html.match(/<table[\s>][\s\S]*?<\/table>/gi) ?? []).map((table) =>
    (table.match(/<tr[\s>][\s\S]*?<\/tr>/gi) ?? []).map((row) =>
      (row.match(/<t[dh][\s>][\s\S]*?<\/t[dh]>/gi) ?? []).map(readCell),
    ),
  );
}

const texts = (row: Cell[]): string[] => row.map((cell) => cell.text);

/** One label per data column: a cell spanning n columns labels all n. */
function expandSpans(row: Cell[]): string[] {
  return row.flatMap((cell) => Array<string>(cell.span).fill(cell.text));
}

function indexesWhere(
  cells: string[],
  test: (text: string, index: number) => boolean,
): number[] {
  return cells.flatMap((text, index) => (test(text, index) ? [index] : []));
}

const NOT_LISTED = /^(n\/?a\b|not invited|$)/i;
/** A header naming subclass 189 alone, e.g. "189", "Subclass 189* Minimum scored". */
const SUBCLASS_189 =
  /^(?:lowest points score invited )?(?:subclass )?189(?![\d/])/i;
const ANY_SUBCLASS = /\b(?:189|190|491)\b/;
const MINIMUM_POINTS = /^minimum points score$/i;
/** 2020-21 rounds list 4-digit unit groups: "Subclass | Occupation ID | Description". */
const UNIT_GROUP_COLUMN = /^occupation id$/i;

type BlockResult = { round: ParsedRound } | { reason: string };

/**
 * True when the round's own totals table (the first "Visa subclass" table;
 * later ones cover the programme year) lists subclass 189 alone.
 */
function listsOnly189(tables: Table[]): boolean {
  const totals = tables.find((table) =>
    /^visa subclass$/i.test(table[0]?.[0]?.text ?? ""),
  );
  const visas = (totals ?? [])
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
  const columns = cutoffColumns(table, headerRow, listsOnly189(tables));
  const rows: ParsedRound["rows"] = [];
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
      rows.push({ occupationName, cutoff: Math.min(...values) });
    }
  }
  return { round: { date, rows } };
}

export type SkippedRound = { date: string; reason: string };
export type RoundPages = { rounds: ParsedRound[]; skipped: SkippedRound[] };

export function parseRoundPagesDetailed(
  currentHtml: string,
  previousHtml: string,
): RoundPages {
  const current = readSchema(currentHtml);
  const currentBlock = arrayField(current, "content").find(
    (item) => stringField(item, "text") === "Current round",
  );
  if (!currentBlock) throw new Error("Current round block missing");
  const block = stringField(currentBlock, "block");
  const issued = /Invitations issued on (\d+ \w+ \d{4})/.exec(block);
  if (!issued) throw new Error("Current round date missing");

  const newest = parseRoundBlock(parseLongDate(issued[1]), block);
  if (!("round" in newest)) {
    throw new Error(`Current round unreadable: ${newest.reason}`);
  }
  const rounds = [newest.round];
  const skipped: SkippedRound[] = [];
  for (const item of arrayField(readSchema(previousHtml), "criteria")) {
    const date = parseLongDate(stringField(item, "title"));
    const result = parseRoundBlock(date, stringField(item, "description"));
    if ("round" in result) rounds.push(result.round);
    else skipped.push({ date, reason: result.reason });
  }
  rounds.sort((a, b) => b.date.localeCompare(a.date));
  return { rounds, skipped };
}

export function parseRoundPages(
  currentHtml: string,
  previousHtml: string,
): ParsedRound[] {
  return parseRoundPagesDetailed(currentHtml, previousHtml).rounds;
}

export async function fetchRoundPages(): Promise<{
  currentHtml: string;
  previousHtml: string;
}> {
  const get = async (url: string) => {
    const response = await fetch(url, {
      headers: { "User-Agent": "Mozilla/5.0" },
      signal: AbortSignal.timeout(40_000),
    });
    if (!response.ok) {
      throw new Error(`${url} returned HTTP ${response.status}`);
    }
    return response.text();
  };
  const [currentHtml, previousHtml] = await Promise.all([
    get(CURRENT_ROUNDS_URL),
    get(PREVIOUS_ROUNDS_URL),
  ]);
  return { currentHtml, previousHtml };
}
