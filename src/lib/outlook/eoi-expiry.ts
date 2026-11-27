import { addYearsToDate } from "../migration";
import type { OutlookInput } from "./evaluate-profile";

const EOI_YEARS = 2;

/** The day a two-year EOI lapsed, if it has (calculatePoints warns the same). */
export function eoiExpiry(input: OutlookInput): string | null {
  const { eoiDate } = input.profile;
  const end = eoiDate ? addYearsToDate(eoiDate, EOI_YEARS) : null;
  return end && end <= input.asOf ? end : null;
}
