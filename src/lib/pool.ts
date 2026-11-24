import { parseCountText } from "./data/published-count";
import type { Interval } from "./data/types";

export type { Interval };
export type { PoolOccupation } from "./data/legacy";

export const countInterval = parseCountText;

export function comparePool(
  occupation: { points: { score: number; count: string }[] },
  score: number,
) {
  const higher = { min: 0, max: 0 };
  const same = { min: 0, max: 0 };
  const total = { min: 0, max: 0 };
  for (const row of occupation.points) {
    const value = countInterval(row.count);
    total.min += value.min;
    total.max += value.max;
    const cohort =
      row.score > score ? higher : row.score === score ? same : null;
    if (cohort) {
      cohort.min += value.min;
      cohort.max += value.max;
    }
  }
  return { higher, same, total };
}

let numberFormat: Intl.NumberFormat | undefined;

/** Built on first use: a formatter costs a few ms to create, and many pages import this module without formatting a count while they load. */
function formatCount(value: number): string {
  numberFormat ??= new Intl.NumberFormat("en-AU");
  return numberFormat.format(value);
}

export function formatInterval(value: Interval): string {
  return value.min === value.max
    ? formatCount(value.min)
    : `${formatCount(value.min)}–${formatCount(value.max)}`;
}

/** Bounds chart work and aligns scores with the five-point comparison bands. */
export function normalizePoolScore(value: number): number {
  return Number.isFinite(value)
    ? Math.min(150, Math.max(0, Math.round(value / 5) * 5))
    : 0;
}
