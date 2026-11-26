import { emptyProfile } from "./migration";
import type { Profile } from "./migration";

const STATES = ["ACT", "NSW", "NT", "QLD", "SA", "TAS", "VIC", "WA"];
const ENUMS: Record<string, readonly string[]> = {
  english: ["unknown", "competent", "proficient", "superior"],
  qualification: ["unknown", "none", "trade", "bachelor", "doctorate"],
  partner: ["unknown", "single", "citizen", "skilled", "english", "none"],
};
const DATE_KEYS = [
  "dob",
  "englishDate",
  "professionalYearDate",
  "communityLanguageExpiry",
  "visaExpiry",
  "assessmentDate",
  "assessmentExpiry",
  "eoiDate",
];
const INCOME_BANDS = ["under-60k", "60-90k", "90-130k", "over-130k"];

function validDate(value: unknown): boolean {
  if (value === "") return true;
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value))
    return false;
  const d = new Date(`${value}T00:00:00Z`);
  return !Number.isNaN(d.getTime()) && d.toISOString().slice(0, 10) === value;
}

const isInt = (v: unknown, max: number): boolean =>
  typeof v === "number" && Number.isInteger(v) && v >= 0 && v <= max;

/** A multiple of 0.1 from 0 to max. */
function isYears(v: unknown, max: number): boolean {
  return (
    typeof v === "number" &&
    v >= 0 &&
    v <= max &&
    Math.abs(v * 10 - Math.round(v * 10)) < 1e-9
  );
}

/** A multiple of 0.5 from 0 to max: what the check's experience fields produce. */
const isHalfYears = (v: unknown, max: number): boolean =>
  typeof v === "number" && v >= 0 && v <= max && Number.isInteger(v * 2);

/**
 * The check's experience answer: 0 to 10 completed years, rounded down to a
 * half year so a typed 2.8 never counts as 3 and the server accepts it.
 */
export function toExperienceYears(value: unknown): number {
  const n = Math.min(10, Math.max(0, Number(value) || 0));
  return Math.floor(n * 2) / 2;
}

const stateOrNone = (v: unknown): boolean =>
  v === "none" || (typeof v === "string" && STATES.includes(v));

const OPTIONAL: Record<string, (v: unknown) => boolean> = {
  monthsLivingInState: (v) => isInt(v, 600),
  monthsWorkingInState: (v) => isInt(v, 600),
  monthsLivingOffshore: (v) => isInt(v, 600),
  yearsExperienceLast3: (v) => isYears(v, 3),
  yearsExperienceLast5: (v) => isYears(v, 5),
  yearsExperienceLast10: (v) => isYears(v, 10),
  jobOfferState: stateOrNone,
  livesRegional: (v) => typeof v === "boolean",
  studyState: stateOrNone,
  incomeBand: (v) => typeof v === "string" && INCOME_BANDS.includes(v),
};

function requiredOk(key: string, base: unknown, value: unknown): boolean {
  if (typeof value !== typeof base) return false;
  if (key in ENUMS) return ENUMS[key].includes(value as string);
  if (DATE_KEYS.includes(key)) return validDate(value);
  if (key === "occupation") return /^([1-9][0-9]{5})?$/.test(value as string);
  if (key === "name") return (value as string).length <= 60;
  if (key === "state") return value === "" || STATES.includes(value as string);
  if (key === "overseasYears" || key === "australianYears")
    return isHalfYears(value, 50);
  return true;
}

/**
 * The strict profile check the server relies on (and the browser's saved
 * profile uses). Returns a new object holding only known keys, or null.
 */
export function parseProfile(value: unknown): Profile | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  const v = value as Record<string, unknown>;
  const out: Record<string, unknown> = {};
  for (const [key, base] of Object.entries(emptyProfile)) {
    if (!requiredOk(key, base, v[key])) return null;
    out[key] = v[key];
  }
  for (const [key, ok] of Object.entries(OPTIONAL)) {
    const raw = v[key];
    if (raw === undefined) continue;
    if (raw !== null && !ok(raw)) return null;
    out[key] = raw;
  }
  return out as Profile;
}
