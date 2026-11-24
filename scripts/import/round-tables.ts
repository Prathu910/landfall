// The round pages' two summary tables: a round's totals ("Total EOIs Invited"
// per subclass, with its tie-break date) and the state nominations table.
import {
  NOMINATION_STATES,
  type NominationsTable,
  type RoundTotal,
} from "../../src/lib/data/rounds-file";
import type { StateCode } from "../../src/lib/data/types";
import {
  cellText,
  extractTables,
  parseCount,
  parseDayFirstDate,
  parseLongDate,
  texts,
  type Table,
} from "./html-tables";

const NO_DATE = /^(n\/?a\*?|)$/i;
/** "11/2025": a month and year (one round printed "15/2024"), naming no day. */
const MONTH_AND_YEAR = /^\d{1,2}\/\d{4}$/;
/** A short year: the 15 Oct 2026 page prints "13/10/206". */
const SHORT_YEAR = /^\d{1,2}\/\d{1,2}\/\d{1,3}$/;
/** Day/month/year shaped; after parseDayFirstDate fails, a date that doesn't exist. */
const DAY_MONTH_YEAR = /^\d{1,2}\/\d{1,2}\/\d{4}$/;
export const TIE_BREAK_COLUMN = /^tie break/i;

/** A tie-break cell stored as no date because its text misprints a date. */
export type TieBreakMisprint = { date: string; where: string; text: string };

/**
 * A tie-break date as ISO. Only a real day-first date (dd/mm/yyyy, or
 * d/m/yyyy) is stored. "N/A", a blank or a month and year alone give null. A
 * misprinted date (a short year, or a date that doesn't exist such as
 * 31/02/2026) also gives null, is never repaired by guessing, and is added to
 * `misprints` so the CLI can print it. Any other text stops the import.
 */
export function parseTieBreak(
  text: string,
  date: string,
  where: string,
  misprints: TieBreakMisprint[],
): string | null {
  const parsed = parseDayFirstDate(text);
  if (parsed !== null) return parsed;
  if (NO_DATE.test(text) || MONTH_AND_YEAR.test(text)) return null;
  if (SHORT_YEAR.test(text) || DAY_MONTH_YEAR.test(text)) {
    misprints.push({ date, where, text });
    return null;
  }
  throw new Error(`Unexpected tie-break date for ${where} on ${date}: ${text}`);
}

/** The round's own totals table: the block's first "Visa subclass" table. */
export function firstVisaTable(tables: Table[]): Table | undefined {
  return tables.find((table) =>
    /^visa subclass$/i.test(table[0]?.[0]?.text ?? ""),
  );
}

/**
 * Reads the totals table when it has a "Total EOIs Invited" column (older
 * rounds' tables say "Number" and give null). The round's tie-break date is
 * the 189 row's, when the table has a tie-break column.
 */
export function parseTotals(
  date: string,
  tables: Table[],
  misprints: TieBreakMisprint[],
): { totals: RoundTotal[] | null; tieBreak: string | null } {
  const table = firstVisaTable(tables);
  const header = texts(table?.[0] ?? []);
  const invitedColumn = header.findIndex((t) =>
    /^total eois invited$/i.test(t),
  );
  if (!table || invitedColumn < 0) return { totals: null, tieBreak: null };
  const tieColumn = header.findIndex((t) => TIE_BREAK_COLUMN.test(t));
  const totals: RoundTotal[] = [];
  let tieBreak: string | null = null;
  for (const cells of table.slice(1).map(texts)) {
    const label = cells[0] ?? "";
    if (cells.every((text) => text === "")) continue;
    const subclass = /\(subclass (\d{3})\)/i.exec(label)?.[1];
    const invited = parseCount(cells[invitedColumn] ?? "");
    if (!subclass || invited === null) {
      throw new Error(
        `Unexpected total invited on ${date}: ${JSON.stringify(cells)}`,
      );
    }
    totals.push({ subclass, label, invited });
    if (subclass === "189" && tieColumn >= 0) {
      tieBreak = parseTieBreak(
        cells[tieColumn] ?? "",
        date,
        "the totals table",
        misprints,
      );
    }
  }
  return { totals, tieBreak };
}

/** The state columns exactly as the page heads them, in order. */
const PAGE_STATE_HEADERS = [
  "ACT",
  "NSW",
  "NT",
  "Qld",
  "SA",
  "Tas",
  "Vic",
  "WA",
];
/** Published values: a count, or a masked "<5". */
const PUBLISHED_VALUE = /^(\d+|\d{1,3}(,\d{3})+|<\d+)$/;

function schemaChanged(detail: string): Error {
  return new Error(
    `Official page schema changed (State and Territory nominations: ${detail}); review the source before importing`,
  );
}

function readPeriod(block: string): Omit<NominationsTable, "byVisa"> {
  const text = cellText(block);
  const year = /(\d{4}-\d{2}) program year/.exec(text);
  const period =
    /from (\d{1,2} [A-Za-z]+ \d{4}) to (\d{1,2} [A-Za-z]+ \d{4})/.exec(text);
  if (!year || !period) throw schemaChanged("program year or period missing");
  return {
    programYear: year[1],
    from: parseLongDate(period[1]),
    to: parseLongDate(period[2]),
  };
}

function readStates(cells: string[]): Record<StateCode, string> {
  if (cells.length !== NOMINATION_STATES.length) {
    throw schemaChanged(`a row has ${cells.length} state values`);
  }
  const byState = {} as Record<StateCode, string>;
  NOMINATION_STATES.forEach((state, i) => {
    if (!PUBLISHED_VALUE.test(cells[i])) {
      throw schemaChanged(`${state} value "${cells[i]}"`);
    }
    byState[state] = cells[i];
  });
  return byState;
}

/**
 * Reads the "State and Territory nominations" block: one table headed
 * Visa subclass, ACT … WA, with a 190 row and a 491 row. Values are kept as
 * published text. Any other layout stops the import.
 */
export function parseNominations(block: string): NominationsTable {
  const tables = extractTables(block);
  if (tables.length !== 1) throw schemaChanged(`${tables.length} tables`);
  const [header, ...rows] = tables[0].map(texts);
  const headed = JSON.stringify(header?.slice(1));
  if (
    !/^visa subclass$/i.test(header?.[0] ?? "") ||
    headed !== JSON.stringify(PAGE_STATE_HEADERS)
  ) {
    throw schemaChanged(`columns ${JSON.stringify(header)}`);
  }
  const byVisa: Partial<NominationsTable["byVisa"]> = {};
  for (const [label, ...cells] of rows.filter((row) => row.length > 0)) {
    const visa = /\(subclass (190|491)\)/i.exec(label ?? "")?.[1] as
      "190" | "491" | undefined;
    if (!visa || byVisa[visa]) throw schemaChanged(`row "${label}"`);
    byVisa[visa] = readStates(cells);
  }
  if (!byVisa["190"] || !byVisa["491"]) {
    throw schemaChanged("190 or 491 row missing");
  }
  return {
    ...readPeriod(block),
    byVisa: { "190": byVisa["190"], "491": byVisa["491"] },
  };
}
