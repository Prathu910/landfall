import type { MonthKey } from "../../src/lib/data/types";
import { parseViewRows } from "./generate-rows";
import type { RawViewFile } from "./raw-store";
import { VIEWS, type ViewDefinition, type ViewId } from "./views";

export type ImportMode = "monthly" | "backfill";
export type FetchJob = { view: ViewDefinition; month: MonthKey };

/** Page-read budgets from the spec. */
export const PAGE_READ_BUDGET: Record<ImportMode, number> = {
  monthly: 150,
  backfill: 600,
};

/** Multi-month views whose previous month is re-fetched to detect revisions. */
const REVISION_CHECKED: ViewId[] = [
  "status-history",
  "invited-by-score",
  "state-invited",
];

export function shiftMonth(month: MonthKey, delta: number): MonthKey {
  const index =
    Number(month.slice(0, 4)) * 12 + Number(month.slice(5, 7)) - 1 + delta;
  return `${Math.floor(index / 12)}-${String((index % 12) + 1).padStart(2, "0")}`;
}

/** The view's months before asAt, oldest first. */
function earlierWindowMonths(view: ViewDefinition, asAt: MonthKey): MonthKey[] {
  if (view.months === "latest") return [];
  const count = view.months.latest - 1;
  return Array.from({ length: count }, (_, i) => shiftMonth(asAt, i - count));
}

/**
 * Every view at asAt (pool-by-score first, because its scores partition
 * cohorts-by-score), then either the previous month of the revision-checked
 * views (monthly) or every unstored month in each view's window, asAt
 * included (backfill).
 */
export function planFetches(
  asAt: MonthKey,
  mode: ImportMode,
  isStored: (viewId: ViewId, month: MonthKey) => boolean,
): FetchJob[] {
  const atAsAt = VIEWS.map((view) => ({ view, month: asAt }));
  if (mode === "monthly") {
    const previous = shiftMonth(asAt, -1);
    return [
      ...atAsAt,
      ...VIEWS.filter((view) => REVISION_CHECKED.includes(view.id)).map(
        (view) => ({ view, month: previous }),
      ),
    ];
  }
  // A backfill is resumable: anything already stored, asAt included, is kept.
  return [
    ...atAsAt,
    ...VIEWS.flatMap((view) =>
      earlierWindowMonths(view, asAt).map((month) => ({ view, month })),
    ),
  ].filter((job) => !isStored(job.view.id, job.month));
}

/** Distinct scores in a pool-by-score file, in numeric order. */
export function poolScores(file: RawViewFile): string[] {
  const view = VIEWS.find((candidate) => candidate.id === "pool-by-score")!;
  const scores = new Set(
    parseViewRows(view, file).flatMap((row) => (row.score ? [row.score] : [])),
  );
  return [...scores].sort((a, b) => Number(a) - Number(b));
}
