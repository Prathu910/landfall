import type { MonthKey } from "../data/types";

const SYDNEY_DATE = new Intl.DateTimeFormat("en-CA", {
  timeZone: "Australia/Sydney",
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
});

/** The Australia/Sydney calendar date (YYYY-MM-DD) at an instant. */
export function sydneyDate(now: Date): string {
  const part = (type: string) =>
    SYDNEY_DATE.formatToParts(now).find((p) => p.type === type)?.value ?? "";
  return `${part("year")}-${part("month")}-${part("day")}`;
}

/** The data month of a round date, which is already a Sydney date. */
export function monthOfDate(date: string): MonthKey {
  return date.slice(0, 7);
}
