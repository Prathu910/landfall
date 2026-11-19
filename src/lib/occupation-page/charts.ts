import { calendarMonths } from "../data/months";
import { parseCountText, sumIntervals } from "../data/published-count";
import type {
  CountText,
  EoiStatus,
  Interval,
  MonthKey,
  OccupationDetail,
  ScoreCounts,
} from "../data/types";
import { formatDate } from "../migration";
import { formatCount, formatMonth, isMasked } from "../report/copy";
import type { Round } from "../report/round-status";

export type PoolBar = {
  score: number;
  label: string;
  masked: boolean;
  share: number;
};

/** Bars for one pool, lowest score first, scaled to the largest bar. */
export function poolBars(
  pool: { total: CountText; byScore: ScoreCounts } | undefined,
): PoolBar[] {
  if (!pool) return [];
  const bars = Object.entries(pool.byScore).map(([score, text]) => {
    const count = parseCountText(text);
    return { score: Number(score), count, value: count.max };
  });
  const largest = Math.max(1, ...bars.map((b) => b.value));
  return bars
    .sort((a, b) => a.score - b.score)
    .map((b) => ({
      score: b.score,
      label: formatCount(b.count),
      masked: isMasked(b.count),
      share: b.value / largest,
    }));
}

export type RoundCard = { date: string; label: string; cutoff: number | null };

/** The last `n` rounds, oldest first. */
export function roundCards(rounds189: Round[], n = 8): RoundCard[] {
  return rounds189
    .slice(0, n)
    .reverse()
    .map((r) => ({
      date: r.date,
      label: formatDate(r.date),
      cutoff: r.cutoff,
    }));
}

function pointsRange(cutoffs: number[]): string {
  const lo = Math.min(...cutoffs);
  const hi = Math.max(...cutoffs);
  return lo === hi ? `${lo}` : `${lo} to ${hi}`;
}

/** One or two sentences on how often 189 listed the occupation. */
export function roundsNote(rounds189: Round[], n = 8): string {
  const window = rounds189.slice(0, n);
  const listed = window.flatMap((r) => (r.cutoff === null ? [] : [r.cutoff]));
  const lastFour = window.slice(0, 4);
  if (listed.length === 0) return `Not listed in any of the last ${n} rounds.`;
  const points = pointsRange(listed);
  if (lastFour.every((r) => r.cutoff === null)) {
    const times = listed.length === 1 ? "once" : `${listed.length} times`;
    return `Not listed in the last ${lastFour.length} rounds. The last ${n} rounds listed it ${times}, at ${points} points.`;
  }
  const latest = window.find((r) => r.cutoff !== null)?.cutoff;
  const how =
    listed.length === window.length ? "every one of" : `${listed.length} of`;
  return `Listed in ${how} the last ${n} rounds, at ${points} points. The latest cut-off was ${latest}.`;
}

export type CohortKey = Extract<
  EoiStatus,
  "INVITED" | "LODGED" | "SUBMITTED" | "HOLD" | "CLOSED"
>;
export type CohortSegment = {
  key: CohortKey;
  label: string;
  count: Interval;
  masked: boolean;
};
export type CohortRow = {
  month: string;
  segments: CohortSegment[];
  total: Interval;
};

const SEGMENTS: { key: CohortKey; label: string }[] = [
  { key: "INVITED", label: "Invited" },
  { key: "LODGED", label: "Lodged a visa" },
  { key: "SUBMITTED", label: "Still waiting" },
  { key: "HOLD", label: "On hold" },
  { key: "CLOSED", label: "Closed" },
];

/** Where the EOIs submitted in each of the last `months` months stand now. */
export function cohortRows(
  detail: OccupationDetail | null,
  asAt: MonthKey,
  months = 12,
): CohortRow[] | null {
  const cohorts = detail?.cohorts["189"];
  if (!cohorts) return null;
  return calendarMonths(asAt, months).map((month: MonthKey) => {
    // Absent month inside the cohort window is genuinely zero (docs/DATA.md R8).
    const statuses = cohorts[month] ?? {};
    const segments = SEGMENTS.map(({ key, label }) => {
      const text = statuses[key];
      const count =
        text === undefined ? { min: 0, max: 0 } : parseCountText(text);
      return { key, label, count, masked: isMasked(count) };
    });
    return {
      month: formatMonth(month),
      segments,
      total: sumIntervals(segments.map((s) => s.count)),
    };
  });
}

function sumOf(rows: CohortRow[], key: CohortKey): Interval {
  return sumIntervals(
    rows.map(
      (r) => r.segments.find((s) => s.key === key)?.count ?? { min: 0, max: 0 },
    ),
  );
}

export function cohortNote(name: string, rows: CohortRow[]): string {
  const total = sumIntervals(rows.map((r) => r.total));
  const invited = formatCount(sumOf(rows, "INVITED"));
  const waiting = formatCount(sumOf(rows, "SUBMITTED"));
  return `Across the last ${rows.length} submission months, ${formatCount(total)} EOIs for ${name} were submitted. Of those, ${invited} are invited so far and ${waiting} are still waiting.`;
}
