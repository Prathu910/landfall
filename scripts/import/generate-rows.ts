import { isCountText } from "../../src/lib/data/guards";
import type {
  CountText,
  EoiStatus,
  MonthKey,
  ProfileAttribute,
  StateKey,
  Visa,
} from "../../src/lib/data/types";
import { VISA_NAMES } from "./qlik-constants";
import { decodeRaw, type RawViewFile } from "./raw-store";
import type { DetailField, ViewDefinition } from "./views";

export type ParsedRow = {
  asAt: MonthKey;
  visa: Visa;
  code: string;
  name: string;
  status: EoiStatus;
  count: CountText;
  submittedMonth?: MonthKey;
  score?: string; // shown points column, or the score partition
  state?: StateKey; // from the state partition
  attribute?: ProfileAttribute; // from the attribute partition
  attributeValue?: string; // displayed text, e.g. English "20" or "N/A"
};

type Column = "asAt" | "visa" | "status" | "count" | DetailField;

/**
 * The dashboard always lists columns in its hypercube order, and only for the
 * dimensions that are shown. Regional Study, Specialist Education, Comm
 * Language Qual and Occupation Group sit in this order too, but no view shows
 * them.
 */
const CANONICAL_ORDER: Column[] = [
  "asAt",
  "submittedMonth",
  "visa",
  "occupation",
  "status",
  "points",
  "partnerSkills",
  "english",
  "australianStudy",
  "state",
  "professionalYear",
  "count",
];

/** Titles observed live. Unobserved titles are not asserted; value parsing still checks them. */
const KNOWN_TITLES: Partial<Record<Column, string[]>> = {
  asAt: ["As At Month"],
  visa: ["Visa Type"],
  occupation: ["Occupation"],
  status: ["EOI Status"],
  points: ["Points", "Score"],
  count: ["Count EOIs"],
};

export const STATE_KEYS: StateKey[] = [
  "ACT",
  "NSW",
  "NT",
  "QLD",
  "SA",
  "TAS",
  "VIC",
  "WA",
  "ANY",
];
const ATTRIBUTES: ProfileAttribute[] = [
  "english",
  "australianStudy",
  "professionalYear",
  "partnerSkills",
];
const VISA_BY_NAME = new Map<string, Visa>(
  Object.entries(VISA_NAMES).map(([visa, name]) => [name, visa as Visa]),
);

function slashMonth(text: string): MonthKey | undefined {
  // "mm/yyyy" (As At Month, Month Submitted) or "dd/mm/yyyy" (Month Submitted).
  const match = /^(?:\d{2}\/)?(0[1-9]|1[0-2])\/(\d{4})$/.exec(text);
  return match ? `${match[2]}-${match[1]}` : undefined;
}

function expectedColumns(
  view: ViewDefinition,
  attribute: ProfileAttribute | undefined,
): Column[] {
  const shown = new Set<Column>(view.shown);
  if (attribute) shown.add(attribute);
  return CANONICAL_ORDER.filter(
    (column) =>
      column === "asAt" ||
      column === "visa" ||
      column === "status" ||
      column === "count" ||
      shown.has(column),
  );
}

function checkHeader(header: string[], columns: Column[], fail: Fail): void {
  if (header.length !== columns.length) {
    fail(
      `expected ${columns.length} columns (${columns.join(", ")}) but got ${header.length}: ${JSON.stringify(header)}`,
    );
  }
  columns.forEach((column, index) => {
    const titles = KNOWN_TITLES[column];
    if (titles && !titles.includes(header[index])) {
      fail(
        `column ${index + 1} should be ${column} (${titles.join(" or ")}) but is "${header[index]}"`,
      );
    }
  });
}

type Fail = (message: string) => never;

/** The dashboard lists EOIs without an occupation under this text (seen in 04/2026). */
const NO_OCCUPATION = "None Provided";

type Partition = Pick<ParsedRow, "score" | "state" | "attribute">;

function readPartition(
  view: ViewDefinition,
  partition: Record<string, string>,
  fail: Fail,
): Partition {
  const allowed: string[] = [...view.partitionBy];
  if (view.attributeVariants) allowed.push("attribute");
  const keys = Object.keys(partition);
  if (
    keys.length !== allowed.length ||
    !keys.every((key) => allowed.includes(key))
  ) {
    fail(`partition ${JSON.stringify(partition)} should have ${allowed}`);
  }
  const { score, state, attribute } = partition;
  if (score !== undefined && !/^\d+$/.test(score)) fail(`score "${score}"`);
  if (state !== undefined && !STATE_KEYS.includes(state as StateKey)) {
    fail(`state "${state}" is not a named state or ANY`);
  }
  if (
    attribute !== undefined &&
    !ATTRIBUTES.includes(attribute as ProfileAttribute)
  ) {
    fail(`attribute "${attribute}"`);
  }
  return {
    score,
    state: state as StateKey | undefined,
    attribute: attribute as ProfileAttribute | undefined,
  };
}

function parseCell(
  row: Partial<ParsedRow>,
  column: Column,
  text: string,
  view: ViewDefinition,
  asAt: MonthKey,
  fail: Fail,
): void {
  switch (column) {
    case "asAt":
      if (!/^\d{2}\/\d{4}$/.test(text) || slashMonth(text) !== asAt) {
        fail(`As At Month "${text}" does not match ${asAt}`);
      }
      return;
    case "submittedMonth":
      row.submittedMonth =
        slashMonth(text) ?? fail(`Month Submitted "${text}"`);
      return;
    case "visa":
      row.visa = VISA_BY_NAME.get(text) ?? fail(`unknown visa "${text}"`);
      return;
    case "occupation": {
      const match = /^(\d{6}) (.+)$/.exec(text);
      if (!match) fail(`occupation "${text}" is not "<code> <name>"`);
      row.code = match[1];
      row.name = match[2].trim();
      return;
    }
    case "status":
      if (!view.statuses.includes(text as EoiStatus)) {
        fail(`status "${text}" is not one of ${view.statuses}`);
      }
      row.status = text as EoiStatus;
      return;
    case "points":
      if (!/^\d+$/.test(text)) fail(`points "${text}"`);
      row.score = text;
      return;
    case "count":
      if (!isCountText(text)) fail(`invalid count "${text}"`);
      row.count = text;
      return;
    case "state":
      fail("Nominated State must be a partition, not a shown column");
    default:
      if (text === "") fail(`empty ${column} value`);
      row.attributeValue = text;
  }
}

function complete(row: Partial<ParsedRow>, fail: Fail): ParsedRow {
  const { asAt, visa, code, name, status, count } = row;
  if (!asAt || !visa || !code || !name || !status || !count) {
    fail(`row is missing a required column: ${JSON.stringify(row)}`);
  }
  return { ...row, asAt, visa, code, name, status, count };
}

/** Decodes every part of a raw view file into typed rows; throws on any shape change. */
export function parseViewRows(
  view: ViewDefinition,
  file: RawViewFile,
): ParsedRow[] {
  const rows: ParsedRow[] = [];
  for (const part of file.parts) {
    const fail: Fail = (message) => {
      throw new Error(
        `${view.id} ${file.asAt} ${JSON.stringify(part.partition)}: ${message}`,
      );
    };
    const partition = readPartition(view, part.partition, fail);
    const columns = expectedColumns(view, partition.attribute);
    const table = decodeRaw(part.table);
    checkHeader(table.header, columns, fail);
    const occupationColumn = columns.indexOf("occupation");
    for (const cells of table.rows) {
      if (cells.length !== columns.length) {
        fail(`row has ${cells.length} cells: ${JSON.stringify(cells)}`);
      }
      if (cells[occupationColumn] === NO_OCCUPATION) continue;
      const row: Partial<ParsedRow> = { asAt: file.asAt, ...partition };
      columns.forEach((column, index) =>
        parseCell(row, column, cells[index], view, file.asAt, fail),
      );
      rows.push(complete(row, fail));
    }
  }
  return rows;
}

/** One fetched part of a view-month. It was paged to completion, so a missing row is zero. */
export type CoveredPart = Partition & { asAt: MonthKey };

/** The parts a raw view file covers, with validated partitions. */
export function parseViewCoverage(
  view: ViewDefinition,
  file: RawViewFile,
): CoveredPart[] {
  return file.parts.map((part) => {
    const fail: Fail = (message) => {
      throw new Error(
        `${view.id} ${file.asAt} ${JSON.stringify(part.partition)}: ${message}`,
      );
    };
    return { asAt: file.asAt, ...readPartition(view, part.partition, fail) };
  });
}
