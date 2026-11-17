import type { CountText, Interval } from "./types";

export function parseCountText(text: CountText): Interval {
  if (text === "<20") return { min: 0, max: 19 };
  if (!/^\d+$/.test(text)) throw new Error(`Invalid published count: ${text}`);
  const value = Number(text);
  if (!Number.isSafeInteger(value))
    throw new Error("Published count is too large");
  return { min: value, max: value };
}

export function addIntervals(a: Interval, b: Interval): Interval {
  return { min: a.min + b.min, max: a.max + b.max };
}

export function sumIntervals(items: Interval[]): Interval {
  return items.reduce(addIntervals, { min: 0, max: 0 });
}

/**
 * Undefined when the map was never fetched. Zero when the map exists but omits
 * the key, because Qlik drops zero rows from a fully paged table.
 */
export function countIn(
  map: Record<string, CountText> | undefined,
  key: string,
): Interval | undefined {
  if (!map) return undefined;
  const text = map[key];
  return text === undefined ? { min: 0, max: 0 } : parseCountText(text);
}

export function isPositive(i: Interval): boolean {
  return i.min > 0;
}
