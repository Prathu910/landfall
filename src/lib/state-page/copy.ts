import type { Interval, StateCode } from "../data/types";
import { formatNumber, minimumText } from "../updates/format";
import type { StateFigureCell } from "./series";

/** Search names read aloud: "an NSW", "an SA", but "a WA" and "a Victoria". */
const AN: ReadonlySet<StateCode> = new Set(["NSW", "SA", "ACT", "NT"]);

export function withArticle(code: StateCode, searchName: string): string {
  return `${AN.has(code) ? "an" : "a"} ${searchName}`;
}

/**
 * A state figure as a lower bound: "at least 790"; an all-hidden month is
 * "under 20 for each occupation", a month with no row "none published",
 * and an unfetched month "not published". Never "0" for a hidden count.
 */
export function figureText(cell: StateFigureCell | null): string {
  if (cell === null) return "not published";
  if (cell.total.min > 0) return `at least ${formatNumber(cell.total.min)}`;
  return cell.maskedCells > 0
    ? "under 20 for each occupation"
    : "none published";
}

/** A pool total that is never all hidden in practice: "at least 86,627". */
export function poolText(total: Interval | null): string {
  return total === null ? "not published" : minimumText(total);
}

export function hasFloor(cell: StateFigureCell | null): boolean {
  return (cell?.total.min ?? 0) > 0;
}

/** "75–90", or "80" when one score. */
export function scoreSpanText(
  span: { min: number; max: number } | null,
): string {
  if (span === null) return "All under 20";
  return span.min === span.max ? String(span.min) : `${span.min}–${span.max}`;
}
