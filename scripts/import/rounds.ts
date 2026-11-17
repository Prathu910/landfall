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

function extractTables(html: string): string[][][] {
  const tables: string[][][] = [];
  for (const table of html.match(/<table[\s>][\s\S]*?<\/table>/gi) ?? []) {
    const rows = (table.match(/<tr[\s>][\s\S]*?<\/tr>/gi) ?? []).map((row) =>
      (row.match(/<t[dh][\s>][\s\S]*?<\/t[dh]>/gi) ?? []).map(cellText),
    );
    tables.push(rows);
  }
  return tables;
}

const NOT_LISTED = /^(n\/?a\b|not invited|$)/i;

type BlockResult = { round: ParsedRound } | { reason: string };

// Finds the 189 data columns. Most layouts have one header row. The 2022-23
// layouts put group labels (189 / 491) above an offshore/onshore row; each
// group then spans an equal share of the data columns.
function cutoffColumns(table: string[][], headerRow: number): number[] {
  const header = table[headerRow].map((cell) => cell.toLowerCase());
  const single = header.findIndex(
    (cell, index) =>
      index > 0 && (cell.includes("189") || cell.includes("minimum points")),
  );
  if (single >= 0) return [single];
  if (headerRow === 0) return [];
  const groups = table[0].map((cell) => cell.toLowerCase()).slice(1);
  const group = groups.findIndex(
    (cell) => cell.includes("189") || cell.includes("minimum points"),
  );
  const width = Math.floor((header.length - 1) / groups.length);
  if (group < 0 || width < 1) return [];
  return Array.from({ length: width }, (_, i) => 1 + group * width + i);
}

function parseRoundBlock(date: string, block: string): BlockResult {
  const tables = extractTables(block);
  let table: string[][] | undefined;
  let headerRow = 0;
  for (const candidate of tables) {
    const found = candidate
      .slice(0, 2)
      .findIndex((row) => row.some((c) => /occupation/i.test(c)));
    if (found >= 0) {
      table = candidate;
      headerRow = found;
      break;
    }
  }
  if (!table) return { reason: "no table with an Occupation column" };
  const nameColumn = table[headerRow].findIndex((c) => /occupation/i.test(c));
  const columns = cutoffColumns(table, headerRow);
  if (columns.length === 0) throw new Error("Occupation table columns changed");
  const rows: ParsedRound["rows"] = [];
  for (const cells of table.slice(headerRow + 1)) {
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

export function parseRoundPagesDetailed(
  currentHtml: string,
  previousHtml: string,
): { rounds: ParsedRound[]; skipped: SkippedRound[] } {
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
