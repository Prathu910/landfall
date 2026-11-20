import { record, validSummary, type CalculationSummary } from "./contract";
export const FEEDBACK_CONTEXT_KEY = "migratelens-feedback-context-v1";
export function readFeedbackContext(
  raw: string | null,
  now: number,
): CalculationSummary | null {
  if (!raw) return null;
  try {
    const value: unknown = JSON.parse(raw);
    if (
      !record(value) ||
      Object.keys(value).length !== 2 ||
      typeof value.created_at !== "number" ||
      !Number.isFinite(value.created_at) ||
      now < value.created_at ||
      now - value.created_at > 15 * 60 * 1000 ||
      !validSummary(value.summary)
    )
      return null;
    return value.summary;
  } catch {
    return null;
  }
}
