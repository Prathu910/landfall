import { formatDate } from "../migration";
import type { FreeResult } from "../outlook/free-result";
import { REPORT_SECTIONS } from "../report/sections";

type StampsResult = Extract<FreeResult, { kind: "stamps" }>;

/** The right page's running head. The report promises sections, never pages. */
export const TEASER_TITLE = "YOUR FULL REPORT";

/**
 * The frosted panel over the full report's placeholder page. The count is
 * the sections ReportView renders for every report (ruling R1); the ticks
 * name what the report covers and never show its numbers.
 */
export function teaserLines(result: StampsResult): {
  heading: string;
  ticks: [string, string, string];
} {
  return {
    heading: `${REPORT_SECTIONS.length} more sections, written for your ${result.points.base} points`,
    ticks: [
      "EOIs ahead of you, and your estimated wait",
      "All 8 states checked against you",
      "Your fastest ways to more points",
    ],
  };
}

/** Only an occupation with published data can be bought (spec decision 11). */
export function canBuy(result: FreeResult): boolean {
  return result.kind === "stamps";
}

/**
 * The right page's line when there is nothing to buy. A failed fetch or a
 * load in progress never reads as "no data" (CLAUDE.md, ruling R2).
 */
export function resultLine(result: Exclude<FreeResult, StampsResult>): string {
  if (result.kind === "loading") return "Loading published data…";
  switch (result.reason) {
    case "no-occupation":
      return "Choose an occupation to see your visa stamps and a full report.";
    case "load-failed":
      return "We couldn't load the published data. Reload to try again.";
    default:
      return "A full report isn't available for this occupation yet.";
  }
}

/** "Software Engineer · offshore · data as at 31 Oct 2026", under the stamps. */
export function whereLine(
  occupationName: string,
  onshore: boolean,
  snapshotDate: string,
): string {
  const where = onshore ? "in Australia" : "offshore";
  return `${occupationName} · ${where} · data as at ${formatDate(snapshotDate)}`;
}
