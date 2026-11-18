import type { StateCode } from "./data/types";
import type { Profile } from "./migration";

const STATE_CODES: readonly string[] = [
  "ACT",
  "NSW",
  "NT",
  "QLD",
  "SA",
  "TAS",
  "VIC",
  "WA",
];
const INCOME_BANDS = ["under-60k", "60-90k", "90-130k", "over-130k"] as const;

type StateAnswers = Pick<
  Profile,
  | "monthsLivingInState"
  | "monthsWorkingInState"
  | "monthsLivingOffshore"
  | "yearsExperienceLast3"
  | "yearsExperienceLast5"
  | "yearsExperienceLast10"
  | "jobOfferState"
  | "livesRegional"
  | "studyState"
  | "incomeBand"
>;

const STATE_ANSWER_KEYS: (keyof StateAnswers)[] = [
  "monthsLivingInState",
  "monthsWorkingInState",
  "monthsLivingOffshore",
  "yearsExperienceLast3",
  "yearsExperienceLast5",
  "yearsExperienceLast10",
  "jobOfferState",
  "livesRegional",
  "studyState",
  "incomeBand",
];

const months = (v: unknown): number | undefined =>
  typeof v === "number" && Number.isInteger(v) && v >= 0 && v <= 600
    ? v
    : undefined;

const years =
  (max: number) =>
  (v: unknown): number | undefined =>
    typeof v === "number" &&
    v >= 0 &&
    v <= max &&
    Number.isInteger(Math.round(v * 10)) &&
    Math.abs(v * 10 - Math.round(v * 10)) < 1e-9
      ? v
      : undefined;

const stateOrNone = (v: unknown): StateCode | "none" | undefined =>
  v === "none" || (typeof v === "string" && STATE_CODES.includes(v))
    ? (v as StateCode | "none")
    : undefined;

const readers: { [K in keyof StateAnswers]-?: (v: unknown) => unknown } = {
  monthsLivingInState: months,
  monthsWorkingInState: months,
  monthsLivingOffshore: months,
  yearsExperienceLast3: years(3),
  yearsExperienceLast5: years(5),
  yearsExperienceLast10: years(10),
  jobOfferState: stateOrNone,
  livesRegional: (v) => (typeof v === "boolean" ? v : undefined),
  studyState: stateOrNone,
  incomeBand: (v) => INCOME_BANDS.find((band) => band === v),
};

/** Valid state-outlook answers from untrusted data; invalid or null ones are omitted (unanswered). */
export function normaliseStateAnswers(
  raw: Record<string, unknown>,
): Partial<Profile> {
  const out: Record<string, unknown> = {};
  for (const key of STATE_ANSWER_KEYS) {
    const value = readers[key](raw[key]);
    if (value !== undefined) out[key] = value;
  }
  return out as Partial<Profile>;
}

/** Rebuilds a saved profile, keeping its other answers even if a state answer is invalid. */
export function restoreProfile(record: Record<string, unknown>): Profile {
  const base: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(record))
    if (!(STATE_ANSWER_KEYS as string[]).includes(key)) base[key] = value;
  return { ...(base as Profile), ...normaliseStateAnswers(record) };
}
