import snapshot from "../data/pool.json";

export type Interval = { min: number; max: number };
export type Occupation = (typeof snapshot.occupations)[number];
export { snapshot };

export function countInterval(raw: string): Interval {
  if (raw === "<20") return { min: 0, max: 19 };
  if (!/^\d+$/.test(raw)) throw new Error(`Invalid published count: ${raw}`);
  const value = Number(raw);
  if (!Number.isSafeInteger(value))
    throw new Error("Published count is too large");
  return { min: value, max: value };
}

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

const number = new Intl.NumberFormat("en-AU");
export function formatInterval(value: Interval): string {
  return value.min === value.max
    ? number.format(value.min)
    : `${number.format(value.min)}–${number.format(value.max)}`;
}

/** Bounds chart work and aligns scores with the five-point comparison bands. */
export function normalizePoolScore(value: number): number {
  return Number.isFinite(value)
    ? Math.min(150, Math.max(0, Math.round(value / 5) * 5))
    : 0;
}
