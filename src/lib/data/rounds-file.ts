import type { StateCode } from "./types";

/** One row of a round's totals table ("Total EOIs Invited" per subclass). */
export type RoundTotal = { subclass: string; label: string; invited: number };

/**
 * The Home Affairs "State and Territory nominations" table, copied as
 * published: each value is the page's text, including "<5".
 */
export type NominationsTable = {
  programYear: string; // "2026-27"
  from: string; // YYYY-MM-DD
  to: string; // YYYY-MM-DD
  byVisa: Record<"190" | "491", Record<StateCode, string>>;
};

/** One occupation row; `code` is null when no dashboard occupation matched. */
export type StoredRow = {
  name: string;
  code: string | null;
  cutoff: number;
  tieBreak: string | null; // YYYY-MM-DD
};

export type StoredRound = {
  date: string; // YYYY-MM-DD
  /** null when the round's page has no "Total EOIs Invited" table. */
  totals: RoundTotal[] | null;
  /** The totals table's 189 tie-break date, when it gives a day. */
  tieBreak: string | null;
  rows: StoredRow[];
  /** Only the round that was current when its page was read has one. */
  nominations: NominationsTable | null;
};

export type SkippedRound = { date: string; reason: string };

/** src/data/rounds.json: parsed rounds newest first, plus skipped rounds. */
export type RoundsFile = {
  schemaVersion: 2;
  rounds: StoredRound[];
  skipped: SkippedRound[];
};

/** The nominations table's columns, in the page's order. */
export const NOMINATION_STATES: readonly StateCode[] = [
  "ACT",
  "NSW",
  "NT",
  "QLD",
  "SA",
  "TAS",
  "VIC",
  "WA",
];

const DATE_RE = /^\d{4}-(0[1-9]|1[0-2])-(0[1-9]|[12]\d|3[01])$/;

type Obj = Record<string, unknown>;

function isObj(v: unknown): v is Obj {
  return typeof v === "object" && v !== null && !Array.isArray(v);
}

const isDate = (v: unknown): boolean =>
  typeof v === "string" && DATE_RE.test(v);
const isText = (v: unknown): boolean => typeof v === "string" && v !== "";
const isDateOrNull = (v: unknown): boolean => v === null || isDate(v);
const isCount = (v: unknown): boolean => Number.isInteger(v) && Number(v) >= 0;

function isTotal(v: unknown): boolean {
  return (
    isObj(v) &&
    typeof v.subclass === "string" &&
    /^\d{3}$/.test(v.subclass) &&
    isText(v.label) &&
    isCount(v.invited)
  );
}

function isStateRow(v: unknown): boolean {
  return (
    isObj(v) &&
    Object.keys(v).length === NOMINATION_STATES.length &&
    NOMINATION_STATES.every((state) => isText(v[state]))
  );
}

function isNominations(v: unknown): boolean {
  return (
    isObj(v) &&
    typeof v.programYear === "string" &&
    /^\d{4}-\d{2}$/.test(v.programYear) &&
    isDate(v.from) &&
    isDate(v.to) &&
    isObj(v.byVisa) &&
    Object.keys(v.byVisa).length === 2 &&
    isStateRow(v.byVisa["190"]) &&
    isStateRow(v.byVisa["491"])
  );
}

function isStoredRow(v: unknown): boolean {
  return (
    isObj(v) &&
    isText(v.name) &&
    (v.code === null || typeof v.code === "string") &&
    Number.isInteger(v.cutoff) &&
    isDateOrNull(v.tieBreak)
  );
}

function isStoredRound(v: unknown): boolean {
  return (
    isObj(v) &&
    isDate(v.date) &&
    (v.totals === null ||
      (Array.isArray(v.totals) && v.totals.every(isTotal))) &&
    isDateOrNull(v.tieBreak) &&
    Array.isArray(v.rows) &&
    v.rows.every(isStoredRow) &&
    (v.nominations === null || isNominations(v.nominations))
  );
}

function isSkippedRound(v: unknown): boolean {
  return isObj(v) && isDate(v.date) && isText(v.reason);
}

export function isRoundsFile(v: unknown): v is RoundsFile {
  return (
    isObj(v) &&
    v.schemaVersion === 2 &&
    Array.isArray(v.rounds) &&
    v.rounds.every(isStoredRound) &&
    Array.isArray(v.skipped) &&
    v.skipped.every(isSkippedRound)
  );
}
