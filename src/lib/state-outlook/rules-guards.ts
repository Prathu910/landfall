import type {
  FederalList,
  ImportedList,
  OccupationListRef,
  Requirement,
  StateRules,
  Stream,
  StateVisaRules,
} from "./rules-types";

type Obj = Record<string, unknown>;

const DATE_RE = /^\d{4}-(0[1-9]|1[0-2])-(0[1-9]|[12]\d|3[01])$/;
const CODE_RE = /^\d{6}$/;
const UNIT_GROUP_RE = /^\d{4}$/;
const STATES: readonly string[] = [
  "ACT",
  "NSW",
  "NT",
  "QLD",
  "SA",
  "TAS",
  "VIC",
  "WA",
];
const VISAS: readonly string[] = ["190", "491"];
const COHORTS: readonly string[] = [
  "living-in-state",
  "living-in-other-state",
  "offshore",
];
const STATUSES: readonly string[] = ["open", "closed", "restricted", "unknown"];
const VERIFICATIONS: readonly string[] = ["verified", "secondary"];
const RELATED_WORK: readonly string[] = [
  "same-occupation",
  "anzsco-2-digit",
  "anzsco-3-digit",
  "anzsco-4-digit",
  "any-skilled",
];

function isObj(v: unknown): v is Obj {
  return typeof v === "object" && v !== null && !Array.isArray(v);
}

function isStr(v: unknown): v is string {
  return typeof v === "string";
}

function isNonEmpty(v: unknown): v is string {
  return isStr(v) && v.length > 0;
}

function isNum(v: unknown): v is number {
  return typeof v === "number" && Number.isFinite(v) && v >= 0;
}

/** A real calendar date: rejects "2026-02-30" as well as "2026-13-01". */
function isDate(v: unknown): v is string {
  if (!isStr(v) || !DATE_RE.test(v)) return false;
  return new Date(`${v}T00:00:00Z`).toISOString().slice(0, 10) === v;
}

function hasOnlyKeys(o: Obj, keys: readonly string[]): boolean {
  return Object.keys(o).every((k) => keys.includes(k));
}

function isCohorts(v: unknown): boolean {
  return Array.isArray(v) && v.every((c) => isStr(c) && COHORTS.includes(c));
}

function isSourced(v: unknown, valueOk: (x: unknown) => boolean): boolean {
  return (
    isObj(v) &&
    hasOnlyKeys(v, ["value", "source", "checkedAt", "verification", "note"]) &&
    valueOk(v.value) &&
    isNonEmpty(v.source) &&
    isDate(v.checkedAt) &&
    isStr(v.verification) &&
    VERIFICATIONS.includes(v.verification) &&
    (v.note === undefined || isStr(v.note))
  );
}

function isListRef(v: unknown): v is OccupationListRef {
  if (!isObj(v)) return false;
  if (v.kind === "list") {
    return (
      hasOnlyKeys(v, ["kind", "listId", "streams"]) &&
      isNonEmpty(v.listId) &&
      (v.streams === undefined ||
        (Array.isArray(v.streams) &&
          v.streams.length > 0 &&
          v.streams.every(isNonEmpty) &&
          new Set(v.streams).size === v.streams.length))
    );
  }
  return (
    (v.kind === "all-federally-eligible" ||
      v.kind === "none-published" ||
      v.kind === "not-imported") &&
    hasOnlyKeys(v, ["kind"])
  );
}

/** Months, plus an optional "of the last M months" window at least that long. */
function isMonths(v: Obj): boolean {
  return (
    isNum(v.months) &&
    (v.ofLastMonths === undefined ||
      (isNum(v.ofLastMonths) && v.ofLastMonths >= v.months))
  );
}

function isRequirement(v: unknown): v is Requirement {
  if (!isObj(v)) return false;
  switch (v.kind) {
    case "min-months-living-in-state":
    case "min-months-living-offshore":
      return hasOnlyKeys(v, ["kind", "months", "ofLastMonths"]) && isMonths(v);
    case "min-months-working-in-state":
      return (
        hasOnlyKeys(v, ["kind", "months", "related", "ofLastMonths"]) &&
        isMonths(v) &&
        isStr(v.related) &&
        RELATED_WORK.includes(v.related)
      );
    case "visa-expiry-before":
      return hasOnlyKeys(v, ["kind", "date"]) && isDate(v.date);
    case "min-years-experience":
      return (
        hasOnlyKeys(v, ["kind", "years", "withinYears", "related"]) &&
        isNum(v.years) &&
        isNum(v.withinYears) &&
        isStr(v.related) &&
        RELATED_WORK.includes(v.related)
      );
    case "job-offer-in-state":
    case "lives-regional":
    case "studied-in-state":
      return hasOnlyKeys(v, ["kind"]);
    default:
      return false;
  }
}

function isStream(v: unknown): v is Stream {
  return (
    isObj(v) &&
    hasOnlyKeys(v, [
      "id",
      "name",
      "cohorts",
      "status",
      "restriction",
      "occupations",
      "requirements",
    ]) &&
    isNonEmpty(v.id) &&
    isNonEmpty(v.name) &&
    isSourced(v.cohorts, isCohorts) &&
    isSourced(v.status, (x) => isStr(x) && STATUSES.includes(x)) &&
    (v.restriction === undefined || isSourced(v.restriction, isStr)) &&
    isSourced(v.occupations, isListRef) &&
    Array.isArray(v.requirements) &&
    v.requirements.every((r) => isSourced(r, isRequirement))
  );
}

function isScoreSystem(v: unknown): boolean {
  return (
    isObj(v) &&
    hasOnlyKeys(v, ["name", "url"]) &&
    isNonEmpty(v.name) &&
    isNonEmpty(v.url)
  );
}

function isVisaRules(v: unknown): v is StateVisaRules {
  return (
    isObj(v) &&
    hasOnlyKeys(v, [
      "state",
      "visa",
      "selectionSystem",
      "ownScoreSystem",
      "streams",
      "resultsUrl",
    ]) &&
    isStr(v.state) &&
    STATES.includes(v.state) &&
    isStr(v.visa) &&
    VISAS.includes(v.visa) &&
    isSourced(v.selectionSystem, isStr) &&
    (v.ownScoreSystem === undefined ||
      isSourced(v.ownScoreSystem, isScoreSystem)) &&
    Array.isArray(v.streams) &&
    v.streams.every(isStream) &&
    (v.resultsUrl === undefined || isNonEmpty(v.resultsUrl))
  );
}

export function isStateRules(v: unknown): v is StateRules {
  return (
    isObj(v) &&
    hasOnlyKeys(v, ["programYear", "rules"]) &&
    v.programYear === "2026-27" &&
    Array.isArray(v.rules) &&
    v.rules.every(isVisaRules)
  );
}

/**
 * Where curated rules fail the guard: "WA 190 stream wa-graduate",
 * "WA 190 (rule fields)", or null when they pass. Used for load-time errors.
 */
export function invalidRulePath(rules: StateRules): string | null {
  const ok = (rule: StateVisaRules) =>
    isStateRules({ programYear: rules.programYear, rules: [rule] });
  for (const r of rules.rules) {
    if (ok(r)) continue;
    if (!ok({ ...r, streams: [] })) return `${r.state} ${r.visa} (rule fields)`;
    const bad = r.streams.find((s) => !ok({ ...r, streams: [s] }));
    return `${r.state} ${r.visa} stream ${bad?.id ?? "(unknown)"}`;
  }
  return isStateRules(rules) ? null : "(programYear)";
}

function isEntryStreams(v: unknown): boolean {
  if (!isObj(v) || !hasOnlyKeys(v, ["190", "491"])) return false;
  const tagLists = Object.values(v);
  return (
    tagLists.length > 0 &&
    tagLists.every(
      (tags) =>
        Array.isArray(tags) && tags.length > 0 && tags.every(isNonEmpty),
    )
  );
}

function isListEntry(v: unknown): boolean {
  return (
    isObj(v) &&
    hasOnlyKeys(v, ["190", "491", "streams", "viaUnitGroup"]) &&
    (v["190"] === undefined || isCohorts(v["190"])) &&
    (v["491"] === undefined || isCohorts(v["491"])) &&
    (v.streams === undefined || isEntryStreams(v.streams)) &&
    (v.viaUnitGroup === undefined ||
      (isStr(v.viaUnitGroup) && UNIT_GROUP_RE.test(v.viaUnitGroup)))
  );
}

function entriesOk(v: unknown, entryOk: (x: unknown) => boolean): boolean {
  return (
    isObj(v) &&
    Object.entries(v).every(([code, e]) => CODE_RE.test(code) && entryOk(e))
  );
}

export function isImportedList(v: unknown): v is ImportedList {
  return (
    isObj(v) &&
    hasOnlyKeys(v, ["listId", "source", "checkedAt", "entries"]) &&
    isNonEmpty(v.listId) &&
    isNonEmpty(v.source) &&
    isDate(v.checkedAt) &&
    entriesOk(v.entries, isListEntry)
  );
}

export function isFederalList(v: unknown): v is FederalList {
  return (
    isObj(v) &&
    hasOnlyKeys(v, ["source", "checkedAt", "entries"]) &&
    isNonEmpty(v.source) &&
    isDate(v.checkedAt) &&
    entriesOk(
      v.entries,
      (e) =>
        isObj(e) &&
        hasOnlyKeys(e, ["190", "491"]) &&
        typeof e["190"] === "boolean" &&
        typeof e["491"] === "boolean",
    )
  );
}
