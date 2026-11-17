import type { Manifest, MonthKey } from "./types";

/** Provenance shown beside every displayed SkillSelect number. */
export type ReportSource = {
  snapshotDate: string; // YYYY-MM-DD, last day of the as-at month
  checkedAt: string; // YYYY-MM-DD
  dashboardUrl: string;
  roundsUrl: string;
  previousRoundsUrl: string;
};

/** Last calendar day of a "YYYY-MM" month, as YYYY-MM-DD. */
export function monthEnd(month: MonthKey): string {
  const [year, mon] = month.split("-").map(Number);
  const day = new Date(Date.UTC(year, mon, 0)).getUTCDate();
  return `${month}-${String(day).padStart(2, "0")}`;
}

/** SkillSelect publishes month-end snapshots, so `asAt` dates to its last day. */
export function reportSource(
  asAt: MonthKey,
  manifest: Pick<Manifest, "checkedAt" | "sources">,
): ReportSource {
  return {
    snapshotDate: monthEnd(asAt),
    checkedAt: manifest.checkedAt,
    dashboardUrl: manifest.sources.dashboard,
    roundsUrl: manifest.sources.currentRounds,
    previousRoundsUrl: manifest.sources.previousRounds,
  };
}
