import type { OccupationIndexEntry } from "./types";

/**
 * Public URL of an occupation data file, or null unless the code is in the
 * index. Never builds a URL from unchecked input.
 */
export function occupationDataUrl(
  code: string,
  index: OccupationIndexEntry[],
  kind: "core" | "detail",
): string | null {
  const entry = index.find((e) => e.code === code);
  if (!entry) return null;
  return `/data/occupations/${entry.code}${kind === "detail" ? ".detail" : ""}.json`;
}

/**
 * The code to fetch published data for, or null when there is nothing to
 * fetch: unknown codes, the points-only choice, indexed occupations
 * without published data (hasData false), and occupations that have dropped
 * out of the data (lastAsAt), whose old figures are never read as current.
 */
export function publishedOccupationCode(
  code: string,
  index: OccupationIndexEntry[],
): string | null {
  return index.some((e) => e.code === code && e.hasData && !e.lastAsAt)
    ? code
    : null;
}
