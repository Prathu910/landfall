import type { MonthKey } from "../data/types";

/** What a run did, written to --report-file on success and on failure. */
export type ImportReport = {
  mode: "probe" | "monthly" | "backfill" | "generate-only" | "rounds-only";
  asAt: MonthKey | null;
  newestAsAt: MonthKey | null;
  pageReads: number;
  budget: number | null;
  revisions: { path: string; rowsBefore: number; rowsAfter: number }[];
  unmatched: string[];
  newRounds: string[];
  durationSeconds: number;
};
