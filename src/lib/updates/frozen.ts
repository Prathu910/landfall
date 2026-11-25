import type { RecapFacts } from "./types";

/** Key-order-independent JSON, so formatting never counts as a change. */
function canonical(value: unknown): string {
  if (Array.isArray(value)) return `[${value.map(canonical).join(",")}]`;
  if (value && typeof value === "object") {
    const entries = Object.entries(value as Record<string, unknown>)
      .filter(([, v]) => v !== undefined)
      .sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0))
      .map(([k, v]) => `${JSON.stringify(k)}:${canonical(v)}`);
    return `{${entries.join(",")}}`;
  }
  return JSON.stringify(value) ?? "null";
}

/**
 * The sections of `base` (the facts file on main) that `head` changes or
 * drops: `rounds[<date>]` and `data`. Header fields (`updatedAt` and so on)
 * are ignored, and sections that are new in `head` are fine. No base file
 * (a new month) freezes nothing.
 */
export function changedFrozenSections(
  base: RecapFacts | null,
  head: RecapFacts,
): string[] {
  if (!base) return [];
  const changed: string[] = [];
  for (const date of Object.keys(base.rounds).sort()) {
    const next = head.rounds[date];
    if (!next || canonical(next) !== canonical(base.rounds[date]))
      changed.push(`rounds[${date}]`);
  }
  if (base.data !== null && canonical(base.data) !== canonical(head.data))
    changed.push("data");
  return changed;
}

/** True when main already holds this month's data section. */
export function hasPublishedData(base: RecapFacts | null): boolean {
  return base !== null && base.data !== null;
}

/** True when main already holds the section for the round on `date`. */
export function hasPublishedRound(
  base: RecapFacts | null,
  date: string,
): boolean {
  return base !== null && date in base.rounds;
}
