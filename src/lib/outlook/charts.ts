import { formatMonth } from "../report/copy";
import type { OccupationCore } from "../data/types";
import type { Improve } from "./improve";

export type CutoffColumn = { month: string; cutoff: number | null }; // "Oct 26"; oldest first
export type CutoffColumns = {
  columns: CutoffColumn[];
  you: number;
  target: { points: number; label: string } | null;
  pass: 65 | null;
  aria: string;
};

const PASS_MARK = 65;
const COLUMN_COUNT = 6;

/** "2026-10-15" becomes "Oct 26". */
function columnMonth(date: string): string {
  return formatMonth(date.slice(0, 7)).replace(/ \d\d(\d\d)$/, " $1");
}

function targetOf(improve: Improve): CutoffColumns["target"] {
  const best = improve.moves.find((m) => m.best);
  if (!best) return null;
  const name =
    best.id === "combined"
      ? "both together"
      : best.title.replace(/, \+\d+$/, "");
  return { points: best.to.points, label: `With ${name}, ${best.to.points}` };
}

function cutoffAria(
  columns: CutoffColumn[],
  you: number,
  target: CutoffColumns["target"],
  pass: CutoffColumns["pass"],
): string {
  const listed = columns
    .map((c) => `${c.month} ${c.cutoff ?? "not listed"}`)
    .join(", ");
  const parts = [
    `Last ${columns.length} 189 round cut-offs, oldest first: ${listed}.`,
    `You are at ${you}.`,
  ];
  if (pass) parts.push(`The pass mark is ${pass}.`);
  if (target) parts.push(`${target.label}.`);
  return parts.join(" ");
}

export function cutoffColumns(
  core: OccupationCore | null,
  points: number,
  improve: Improve,
): CutoffColumns | null {
  // A round that omits the occupation has a null cut-off; with none listed
  // at all there is nothing to chart.
  if (!core || core.rounds189.every((r) => r.cutoff === null)) return null;
  const columns = core.rounds189
    .slice(0, COLUMN_COUNT)
    .map((r) => ({ month: columnMonth(r.date), cutoff: r.cutoff }))
    .reverse();
  const target = targetOf(improve);
  const pass = points < PASS_MARK ? PASS_MARK : null;
  return {
    columns,
    you: points,
    target,
    pass,
    aria: cutoffAria(columns, points, target, pass),
  };
}
