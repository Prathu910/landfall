import { SITE_URL } from "../site";
import { UPDATES_INDEX_PATH } from "./index-view";
import { recapPath } from "./recap-view";
import type { RecapFacts } from "./types";

/**
 * `/updates/` and every recap, round-only months included (spec 6.6). Each
 * recap is dated by its own `updatedAt`, the index by the newest of them.
 */
export function updatesSitemapEntries(
  recaps: RecapFacts[],
): { url: string; lastModified: string }[] {
  if (recaps.length === 0) return [];
  const sorted = [...recaps].sort((a, b) => (a.month < b.month ? 1 : -1));
  const newest = sorted.map((r) => r.updatedAt).sort()[sorted.length - 1];
  return [
    { url: SITE_URL + UPDATES_INDEX_PATH, lastModified: newest },
    ...sorted.map((r) => ({
      url: SITE_URL + recapPath(r.month),
      lastModified: r.updatedAt,
    })),
  ];
}
