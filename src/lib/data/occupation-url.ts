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
