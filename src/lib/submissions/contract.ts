/** Shared by the browser and Deno. No DOM, runtime globals or personal Profile. */
export const PRIVACY_VERSION = "2026-11-20";
export const FEEDBACK_CATEGORIES = [
  "suggestion",
  "bug",
  "improvement",
  "feature",
  "other",
] as const;
export const AGE_BANDS = [
  "under-18",
  "18-24",
  "25-32",
  "33-39",
  "40-44",
  "45+",
] as const;
export type CalculationSummary = {
  occupation_code: string;
  age_band: (typeof AGE_BANDS)[number];
  location: "onshore" | "offshore";
  base_points: number;
  points_190: number;
  points_491: number;
  snapshot_id: string;
};
export type CalculationSubmission = {
  id: string;
  email: string;
  summary: CalculationSummary;
  privacy_version: typeof PRIVACY_VERSION;
};
export type FeedbackSubmission = {
  id: string;
  category: (typeof FEEDBACK_CATEGORIES)[number];
  message: string;
  email: string | null;
  summary: CalculationSummary | null;
  privacy_version: typeof PRIVACY_VERSION;
};
export type Validation<T> =
  { ok: true; value: T } | { ok: false; error: string };
export function normalizeEmail(email: string): string {
  const trimmed = email.trim();
  const at = trimmed.lastIndexOf("@");
  return at < 0
    ? trimmed
    : trimmed.slice(0, at) + trimmed.slice(at).toLowerCase();
}
export function validEmail(value: unknown): value is string {
  if (typeof value !== "string" || value.length > 254) return false;
  const email = normalizeEmail(value);
  const parts = email.split("@");
  return (
    parts.length === 2 &&
    parts[0].length <= 64 &&
    /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+$/.test(parts[0]) &&
    !parts[0].startsWith(".") &&
    !parts[0].endsWith(".") &&
    !parts[0].includes("..") &&
    parts[1].includes(".") &&
    parts[1]
      .split(".")
      .every(
        (label) =>
          label.length <= 63 &&
          /^[a-zA-Z0-9](?:[a-zA-Z0-9-]*[a-zA-Z0-9])?$/.test(label),
      )
  );
}
export function record(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}
function exact(value: Record<string, unknown>, keys: string[]): boolean {
  return (
    Object.keys(value).length === keys.length &&
    keys.every((key) => Object.hasOwn(value, key))
  );
}
export function validSummary(value: unknown): value is CalculationSummary {
  if (
    !record(value) ||
    !exact(value, [
      "occupation_code",
      "age_band",
      "location",
      "base_points",
      "points_190",
      "points_491",
      "snapshot_id",
    ])
  )
    return false;
  const { base_points: base, points_190: p190, points_491: p491 } = value;
  return (
    typeof value.occupation_code === "string" &&
    /^(?:[1-9]\d{5}|points-only)$/.test(value.occupation_code) &&
    AGE_BANDS.some((b) => b === value.age_band) &&
    ["onshore", "offshore"].includes(String(value.location)) &&
    typeof base === "number" &&
    Number.isInteger(base) &&
    base >= 0 &&
    base <= 200 &&
    base % 5 === 0 &&
    p190 === base + 5 &&
    p491 === base + 15 &&
    typeof value.snapshot_id === "string" &&
    /^skillselect-20\d{2}-(?:0[1-9]|1[0-2])-(?:28|29|30|31)$/.test(
      value.snapshot_id,
    )
  );
}
function validEnvelope(value: Record<string, unknown>): boolean {
  return (
    typeof value.id === "string" &&
    /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
      value.id,
    ) &&
    value.privacy_version === PRIVACY_VERSION
  );
}
export function validateCalculation(
  value: unknown,
): Validation<CalculationSubmission> {
  if (
    !record(value) ||
    !exact(value, ["id", "email", "summary", "privacy_version"]) ||
    !validEnvelope(value) ||
    !validEmail(value.email) ||
    !validSummary(value.summary)
  )
    return {
      ok: false,
      error:
        "Enter a valid email and review your calculation before trying again.",
    };
  return {
    ok: true,
    value: {
      id: String(value.id),
      email: normalizeEmail(String(value.email)),
      summary: value.summary,
      privacy_version: PRIVACY_VERSION,
    },
  };
}
/** Unicode code points match Postgres char_length, including emoji. */
export function feedbackLength(message: string): number {
  return Array.from(message.trim()).length;
}
export function validateFeedback(
  value: unknown,
): Validation<FeedbackSubmission> {
  if (
    !record(value) ||
    !exact(value, [
      "id",
      "category",
      "message",
      "email",
      "summary",
      "privacy_version",
    ]) ||
    !validEnvelope(value) ||
    !FEEDBACK_CATEGORIES.some((c) => c === value.category) ||
    typeof value.message !== "string" ||
    feedbackLength(value.message) < 10 ||
    feedbackLength(value.message) > 3000 ||
    (value.email !== null && !validEmail(value.email)) ||
    (value.summary !== null && !validSummary(value.summary))
  )
    return {
      ok: false,
      error:
        "Choose a category, write 10–3,000 characters, and check your optional email.",
    };
  return {
    ok: true,
    value: {
      id: String(value.id),
      category: value.category as FeedbackSubmission["category"],
      message: value.message.trim(),
      email: value.email === null ? null : normalizeEmail(String(value.email)),
      summary: value.summary,
      privacy_version: PRIVACY_VERSION,
    },
  };
}
