import { monthOfDate } from "./dates";
import type { RecapFacts } from "./types";

type Obj = Record<string, unknown>;

const DATE_RE = /^\d{4}-(0[1-9]|1[0-2])-(0[1-9]|[12]\d|3[01])$/;
const MONTH_RE = /^\d{4}-(0[1-9]|1[0-2])$/;

function isObj(v: unknown): v is Obj {
  return typeof v === "object" && v !== null && !Array.isArray(v);
}

const isDate = (v: unknown): boolean =>
  typeof v === "string" && DATE_RE.test(v);

function isRoundSection(v: unknown): boolean {
  return (
    isObj(v) &&
    isDate(v.generatedAt) &&
    isObj(v.sources) &&
    Array.isArray(v.totals) &&
    Array.isArray(v.occupations) &&
    Array.isArray(v.distribution) &&
    (v.previousRound === null || isObj(v.previousRound)) &&
    (v.comparison === null || isObj(v.comparison)) &&
    Array.isArray(v.cardPicks)
  );
}

function isDataSection(v: unknown): boolean {
  return (
    isObj(v) &&
    isDate(v.generatedAt) &&
    isObj(v.sources) &&
    isObj(v.national) &&
    Array.isArray(v.pool189ByScore) &&
    isObj(v.invitedByScore) &&
    isObj(v.states) &&
    (v.nominations === null || isObj(v.nominations)) &&
    isObj(v.movers) &&
    (v.notable189 === null || isObj(v.notable189)) &&
    Array.isArray(v.largePoolsNotListed) &&
    isObj(v.spotlight)
  );
}

/** Checks the header and section shapes; every round key must be a date inside the file's month. */
export function isRecapFacts(v: unknown): v is RecapFacts {
  if (!isObj(v) || v.schemaVersion !== 1) return false;
  if (typeof v.month !== "string" || !MONTH_RE.test(v.month)) return false;
  if (!isDate(v.firstGeneratedAt) || !isDate(v.updatedAt)) return false;
  if (!isObj(v.rounds)) return false;
  const month = v.month;
  const roundsOk = Object.entries(v.rounds).every(
    ([date, section]) =>
      isDate(date) && monthOfDate(date) === month && isRoundSection(section),
  );
  return roundsOk && (v.data === null || isDataSection(v.data));
}
