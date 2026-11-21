import { calendarMonths } from "../data/months";
import { parseCountText, sumIntervals } from "../data/published-count";
import type { Interval, OccupationCore, OccupationDetail } from "../data/types";
import { formatSummed, submissionMonth } from "../report/copy";
import { higherScoreCount } from "./label-189";
import { submittedBefore } from "./wait";

export type QueueGroup = {
  key:
    | "ahead"
    | "tied"
    | "behind"
    | "you"
    | "higher"
    | "earlier"
    | "month"
    | "later";
  label: string;
  squares: number;
  emphasis: boolean;
};

export type QueueView = {
  kind: "pool" | "lodged";
  unit: 10 | 40 | 50 | 100;
  title: string;
  groups: QueueGroup[];
  aria: string;
};

const MAX_SQUARES = 200;
const UNITS = [10, 40, 50, 100] as const;
const COHORT_WINDOW = 36;

type Slice = {
  key: QueueGroup["key"];
  label: string;
  count: Interval;
  emphasis?: boolean;
};

function middle(i: Interval): number {
  return (i.min + i.max) / 2;
}

function isExact(i: Interval): boolean {
  return i.min === i.max;
}

function roundTo10(value: number): number {
  return value >= 100 ? Math.round(value / 10) * 10 : Math.round(value);
}

/**
 * A derived count: exact when published exactly, else "about" a rounded figure
 * (one number for a single value such as "behind", a range for the rest).
 */
function about(i: Interval, single = false): string {
  // A count from zero reads "under N"; rounding it would invent a figure.
  if (isExact(i) || i.min === 0) return formatSummed(i);
  const low = roundTo10(single ? middle(i) : i.min);
  const high = roundTo10(single ? middle(i) : i.max);
  return `about ${formatSummed({ min: low, max: high })}`;
}

const spoken = (text: string): string => text.replace("–", " to ");

function squareCounts(counts: Interval[], unit: number): number[] {
  return counts.map((c) => {
    const squares = Math.round(middle(c) / unit);
    return middle(c) > 0 ? Math.max(1, squares) : 0;
  });
}

function pickUnit(counts: Interval[]): QueueView["unit"] {
  const fits = UNITS.find(
    (u) => squareCounts(counts, u).reduce((a, b) => a + b, 0) <= MAX_SQUARES,
  );
  return fits ?? UNITS[UNITS.length - 1];
}

function toGroups(slices: Slice[], unit: number): QueueGroup[] {
  const squares = squareCounts(
    slices.map((s) => s.count),
    unit,
  );
  return slices.map((s, i) => ({
    key: s.key,
    label: s.label,
    squares: squares[i],
    emphasis: s.emphasis ?? false,
  }));
}

function plainRange(i: Interval): string {
  return spoken(formatSummed(i));
}

function buildView(
  kind: QueueView["kind"],
  title: string,
  slices: Slice[],
  aria: string,
): QueueView {
  const unit = pickUnit(slices.map((s) => s.count));
  return { kind, unit, title, groups: toGroups(slices, unit), aria };
}

function poolView(
  core: OccupationCore,
  points: number,
  stampedClosed: boolean,
): QueueView | null {
  const pool = core.pool["189"];
  const ahead = higherScoreCount(core, "189", points);
  if (!pool || !ahead) return null;
  const tiedText = pool.byScore[String(points)];
  const tied =
    tiedText === undefined ? { min: 0, max: 0 } : parseCountText(tiedText);
  const total = parseCountText(pool.total);
  const behind = {
    min: Math.max(0, total.min - ahead.max - tied.max),
    max: Math.max(0, total.max - ahead.min - tied.min),
  };
  const first = ahead.max === 0 && tied.max === 0;
  const aheadLarger = middle(ahead) >= middle(tied);
  const slices: Slice[] = [
    {
      key: "ahead",
      label: `Ahead: ${formatSummed(ahead)}`,
      count: ahead,
      emphasis: !first && aheadLarger,
    },
    {
      key: "tied",
      label: `Tied with you: ${formatSummed(tied)}`,
      count: tied,
      emphasis: !first && !aheadLarger,
    },
  ];
  if (first) {
    slices.push({
      key: "you",
      label: "You: first in line",
      count: { min: 1, max: 1 },
      emphasis: true,
    });
  }
  slices.push({
    key: "behind",
    label: `Behind: ${about(behind, true)}`,
    count: behind,
  });
  const idle = stampedClosed ? ", in a pool that isn't being invited" : "";
  const aria = first
    ? `No EOIs ahead or tied. All ${formatSummed(total)} EOIs score lower${idle}.`
    : `${plainRange(ahead)} ahead, ${plainRange(tied)} tied, ${about(behind, true)} behind${idle}.`;
  const title = stampedClosed
    ? "A queue that isn't moving"
    : "Who's in the queue";
  return buildView("pool", title, slices, aria);
}

function submittedAfter(
  detail: OccupationDetail,
  points: number,
  readerMonth: string,
  asAt: string,
): Interval {
  const byMonth = detail.cohortsByScore["189"]?.[String(points)] ?? {};
  // Cohort files are one full download (docs/DATA.md), so a missing month
  // key here is zero, unlike the multi-month maps where it means not fetched.
  return sumIntervals(
    calendarMonths(asAt, COHORT_WINDOW)
      .filter((month) => month > readerMonth)
      .map((month) => parseCountText(byMonth[month] ?? "0")),
  );
}

function lodgedView(
  core: OccupationCore,
  detail: OccupationDetail,
  points: number,
  readerMonth: string,
  stampedClosed: boolean,
): QueueView | null {
  const higher = higherScoreCount(core, "189", points);
  if (!higher) return null;
  const byMonth = detail.cohortsByScore["189"]?.[String(points)] ?? {};
  const earlier = submittedBefore(detail, points, readerMonth);
  // Missing key is zero in a cohort file (docs/DATA.md), not "not fetched".
  const month = parseCountText(byMonth[readerMonth] ?? "0");
  const later = submittedAfter(detail, points, readerMonth, core.asAt);
  const slices: Slice[] = [
    {
      key: "higher",
      label: `Higher score: ${formatSummed(higher)}`,
      count: higher,
    },
    {
      key: "earlier",
      label: `At ${points}, earlier: ${about(earlier)}`,
      count: earlier,
    },
    {
      key: "month",
      label: `Your month: ${formatSummed(month)}`,
      count: month,
      emphasis: true,
    },
    {
      key: "later",
      label: `At ${points}, later: ${about(later)}`,
      count: later,
    },
  ];
  const aria =
    `Your place among EOIs: ${plainRange(higher)} with higher scores, ` +
    `${spoken(about(earlier))} at ${points} submitted earlier, ${formatSummed(month)} in your month, ` +
    `${spoken(about(later))} at ${points} submitted later.`;
  const title = stampedClosed
    ? "A queue that isn't moving"
    : `Your place at ${points}`;
  return buildView("lodged", title, slices, aria);
}

export function queueView(
  core: OccupationCore | null,
  detail: OccupationDetail | null,
  points: number,
  eoiDate: string,
  stampedClosed: boolean,
): QueueView | null {
  if (!core) return null;
  const readerMonth = submissionMonth(eoiDate);
  if (detail && readerMonth && readerMonth <= core.asAt) {
    return lodgedView(core, detail, points, readerMonth, stampedClosed);
  }
  return poolView(core, points, stampedClosed);
}
