import type {
  CountText,
  Manifest,
  OccupationCore,
  OccupationDetail,
  RecordSchemaVersion,
} from "./types";

const RECORD_SCHEMA_VERSION: RecordSchemaVersion = 2;

type Obj = Record<string, unknown>;

const VISAS: readonly string[] = ["189", "190", "491"];
const STATE_VISAS: readonly string[] = ["190", "491"];
const STATUSES: readonly string[] = [
  "SUBMITTED",
  "INVITED",
  "LODGED",
  "HOLD",
  "CLOSED",
];
const STATE_KEYS: readonly string[] = [
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
const ATTRIBUTES: readonly string[] = [
  "english",
  "australianStudy",
  "professionalYear",
  "partnerSkills",
];

const COUNT_RE = /^(\d+|<20)$/;
const MONTH_RE = /^\d{4}-(0[1-9]|1[0-2])$/;
const DATE_RE = /^\d{4}-(0[1-9]|1[0-2])-(0[1-9]|[12]\d|3[01])$/;

function isObj(v: unknown): v is Obj {
  return typeof v === "object" && v !== null && !Array.isArray(v);
}

function isStr(v: unknown): v is string {
  return typeof v === "string";
}

export function isCountText(v: unknown): v is CountText {
  return isStr(v) && COUNT_RE.test(v);
}

function isMonth(k: string): boolean {
  return MONTH_RE.test(k);
}

function isMonthOrOlder(k: string): boolean {
  return k === "older" || isMonth(k);
}

/** Object whose keys pass `keyOk` and whose values pass `valueOk`. */
function isMap(
  v: unknown,
  keyOk: (k: string) => boolean,
  valueOk: (x: unknown) => boolean,
): boolean {
  return (
    isObj(v) && Object.entries(v).every(([k, x]) => keyOk(k) && valueOk(x))
  );
}

const anyKey = (): boolean => true;
const inSet =
  (set: readonly string[]) =>
  (k: string): boolean =>
    set.includes(k);

const isScoreCounts = (v: unknown): boolean => isMap(v, anyKey, isCountText);
const isStatusCounts = (v: unknown): boolean =>
  isMap(v, inSet(STATUSES), isCountText);
const byVisa =
  (valueOk: (x: unknown) => boolean, visas = VISAS) =>
  (v: unknown): boolean =>
    isMap(v, inSet(visas), valueOk);
const byMonth =
  (valueOk: (x: unknown) => boolean) =>
  (v: unknown): boolean =>
    isMap(v, isMonth, valueOk);
const byMonthOrOlder =
  (valueOk: (x: unknown) => boolean) =>
  (v: unknown): boolean =>
    isMap(v, isMonthOrOlder, valueOk);
const byState =
  (valueOk: (x: unknown) => boolean) =>
  (v: unknown): boolean =>
    isMap(v, inSet(STATE_KEYS), valueOk);

function isRound(v: unknown): boolean {
  return (
    isObj(v) &&
    isStr(v.date) &&
    DATE_RE.test(v.date) &&
    (v.cutoff === null ||
      (typeof v.cutoff === "number" && Number.isFinite(v.cutoff)))
  );
}

function hasIdentity(v: Obj): boolean {
  return (
    v.schemaVersion === RECORD_SCHEMA_VERSION &&
    isStr(v.snapshotId) &&
    isStr(v.asAt) &&
    isMonth(v.asAt) &&
    isStr(v.code) &&
    v.code.length > 0
  );
}

export function isOccupationCore(v: unknown): v is OccupationCore {
  if (!isObj(v) || !hasIdentity(v)) return false;
  return (
    isStr(v.name) &&
    (v.group === null || isStr(v.group)) &&
    byVisa((p) => isObj(p) && isCountText(p.total) && isScoreCounts(p.byScore))(
      v.pool,
    ) &&
    byVisa(byMonth(isStatusCounts))(v.statusHistory) &&
    byVisa(byMonth(isScoreCounts))(v.invitedByScore) &&
    byVisa(byState(isScoreCounts), STATE_VISAS)(v.statePool) &&
    byVisa(byState(byMonth(isScoreCounts)), STATE_VISAS)(v.stateInvited) &&
    Array.isArray(v.rounds189) &&
    v.rounds189.every(isRound)
  );
}

export function isOccupationDetail(v: unknown): v is OccupationDetail {
  if (!isObj(v) || !hasIdentity(v)) return false;
  const attributes = (valueOk: (x: unknown) => boolean) => (x: unknown) =>
    isMap(x, inSet(ATTRIBUTES), valueOk);
  return (
    byVisa(byMonthOrOlder(isStatusCounts))(v.cohorts) &&
    byVisa((s) => isMap(s, anyKey, byMonthOrOlder(isCountText)))(
      v.cohortsByScore,
    ) &&
    byVisa(attributes(byMonth((m) => isMap(m, anyKey, isCountText))))(
      v.invitedProfile,
    ) &&
    byVisa(
      byState(attributes((a) => isMap(a, anyKey, isCountText))),
      STATE_VISAS,
    )(v.invitedProfileState)
  );
}

/** lastAsAt and lastCheckedAt come together, or not at all. */
function validDropMarks(o: Obj): boolean {
  const { lastAsAt, lastCheckedAt } = o;
  if (lastAsAt === undefined && lastCheckedAt === undefined) return true;
  return (
    isStr(lastAsAt) &&
    isMonth(lastAsAt) &&
    isStr(lastCheckedAt) &&
    DATE_RE.test(lastCheckedAt)
  );
}

export function isManifest(v: unknown): v is Manifest {
  if (!isObj(v)) return false;
  if (
    v.schemaVersion !== 1 ||
    !isStr(v.snapshotId) ||
    !isStr(v.asAt) ||
    !isMonth(v.asAt) ||
    !isStr(v.checkedAt) ||
    !DATE_RE.test(v.checkedAt) ||
    !(
      v.roundsCheckedAt === undefined ||
      (isStr(v.roundsCheckedAt) && DATE_RE.test(v.roundsCheckedAt))
    ) ||
    !isStr(v.importVersion) ||
    !isObj(v.sources) ||
    !isStr(v.sources.dashboard) ||
    !isStr(v.sources.currentRounds) ||
    !isStr(v.sources.previousRounds) ||
    !Array.isArray(v.roundsUnmatched) ||
    !v.roundsUnmatched.every(isStr) ||
    !Array.isArray(v.occupations)
  ) {
    return false;
  }
  const seen = new Set<string>();
  for (const o of v.occupations) {
    if (
      !isObj(o) ||
      !isStr(o.code) ||
      !isStr(o.name) ||
      typeof o.hasData !== "boolean" ||
      !(o.group === null || isStr(o.group)) ||
      !byVisa(isCountText)(o.totals) ||
      !validDropMarks(o) ||
      seen.has(o.code)
    ) {
      return false;
    }
    seen.add(o.code);
  }
  return true;
}
