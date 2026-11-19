import type { OccupationIndexEntry } from "../../lib/data/types";
import { occupationPath } from "../../lib/occupation-page/slug";

/** The full-report link. Only the occupation code travels; points never go in the URL. */
export function fullReportHref(code: string): string {
  return `/check/?occupation=${code}`;
}

/** The link to the chosen occupation's page; null on that page itself. */
export function occupationPageLink(
  entry: OccupationIndexEntry | undefined,
  currentCode?: string,
): { href: string; text: string } | null {
  if (!entry || entry.code === currentCode) return null;
  return { href: occupationPath(entry), text: `See the ${entry.name} page` };
}
