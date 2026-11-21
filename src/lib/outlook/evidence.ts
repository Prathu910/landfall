import { calendarMonths } from "../data/months";
import { parseCountText } from "../data/published-count";
import type { Interval, MonthKey, OccupationCore } from "../data/types";
import type { StateCode, StateVisa } from "../data/types";
import { formatDate } from "../migration";
import { normalizePoolScore } from "../pool";
import { buildEoisLikeYours } from "../report/eois-like-yours";
import type { EoisLikeYours } from "../report/eois-like-yours";
import { formatCount, formatMonth, formatSummed } from "../report/copy";
import type { OutlookInput, ProfileOutlook } from "./evaluate-profile";
import type { VisaLabel } from "./label-state";
import type { OutlookLabel } from "./labels";
import {
  flagNote,
  isLodged,
  longMonth,
  monthsOfSix,
  occupationName,
} from "./phrases";

export type RoundRow = {
  date: string;
  cutoff: string;
  /** "Enough" or "Short by N"; null when the round didn't list the occupation. */
  verdict: string | null;
};

export type PoolBar = {
  score: number;
  /** "70", "70 (you)", or "70 (your band)" when the reader's score falls inside it. */
  label: string;
  count: string;
  /** Bar length against the tallest bar, 0 to 1 (interval midpoints). */
  share: number;
  side: "higher" | "you" | "lower";
};

export type StateRow = {
  state: StateCode;
  latest: string;
  months: string;
  label: OutlookLabel;
  flag: string | null;
  /** The state's rules in one line (printed appendix). */
  rules: string;
};

export type StateTable = {
  visa: StateVisa;
  title: string;
  sub: string;
  rows: StateRow[];
};

export type CohortEvidence = {
  title: string;
  sub: string;
  outcomes: EoisLikeYours;
};

export type Evidence = {
  rounds: { you: number; rows: RoundRow[] } | null;
  roundsEmpty: string;
  pool: { note: string; bars: PoolBar[]; aria: string } | null;
  poolEmpty: string;
  cohort: CohortEvidence | null;
  states: StateTable[];
  statesEmpty: string;
};

const ROUNDS_SINCE = "2022-01-01";
const STATE_WINDOW = 6;

function verdictOf(cutoff: number | null, you: number): string | null {
  if (cutoff === null) return null;
  return you >= cutoff ? "Enough" : `Short by ${cutoff - you}`;
}

function roundRows(core: OccupationCore, you: number): RoundRow[] {
  return core.rounds189
    .filter((round) => round.date >= ROUNDS_SINCE)
    .map((round) => ({
      date: formatDate(round.date),
      cutoff: round.cutoff === null ? "Not listed" : String(round.cutoff),
      verdict: verdictOf(round.cutoff, you),
    }));
}

function middle(count: Interval): number {
  return (count.min + count.max) / 2;
}

function barLabel(score: number, at: number, you: number): string {
  if (score !== at) return String(score);
  return score === you ? `${score} (you)` : `${score} (your band)`;
}

/** One bar per published score band, in score order. */
export function poolBars(
  byScore: Record<string, string>,
  you: number,
): PoolBar[] {
  const scored = Object.entries(byScore)
    .map(([score, text]) => ({
      score: Number(score),
      count: parseCountText(text),
    }))
    .sort((a, b) => a.score - b.score);
  const tallest = Math.max(1, ...scored.map((s) => middle(s.count)));
  const at = normalizePoolScore(you);
  return scored.map(({ score, count }) => ({
    score,
    label: barLabel(score, at, you),
    count: formatCount(count),
    share: middle(count) / tallest,
    side: score > at ? "higher" : score === at ? "you" : "lower",
  }));
}

function poolOf(input: OutlookInput, core: OccupationCore, you: number) {
  const pool = core.pool["189"];
  if (!pool) return null;
  const bars = poolBars(pool.byScore, you);
  const listed = bars.map((bar) => `${bar.score}: ${bar.count}`).join(", ");
  const total = formatCount(parseCountText(pool.total));
  return {
    note: `${total} ${occupationName(input)} EOIs waiting, as at ${formatMonth(core.asAt)}.`,
    bars,
    aria: `189 pool by points: ${listed}. You are at ${you}.`,
  };
}

/** The reader's own month once lodged; otherwise EOIs from a year before today. */
function cohortMonth(input: OutlookInput): MonthKey {
  const own = input.profile.eoiDate.slice(0, 7);
  if (isLodged(input) && /^\d{4}-\d{2}$/.test(own)) return own;
  return calendarMonths(input.asOf.slice(0, 7), 13)[0];
}

function cohortOf(input: OutlookInput, core: OccupationCore): CohortEvidence {
  const month = cohortMonth(input);
  const name = occupationName(input);
  return {
    title: isLodged(input)
      ? "What happened to EOIs from your month"
      : "What happened to EOIs from a year ago",
    sub: `${name} 189 EOIs submitted in ${longMonth(month)} (all scores), as at ${longMonth(core.asAt)}.`,
    outcomes: buildEoisLikeYours({
      occupationName: name,
      core,
      detail: input.detail,
      submittedMonth: month,
      asOf: input.asOf,
    }),
  };
}

/** A masked (or summed masked) count may hide zero invitations, so it says so. */
function latestText(month: MonthKey, count: Interval): string {
  const mayBeZero = count.min === 0 ? " (may be zero)" : "";
  return `${formatMonth(month)}: ${formatSummed(count)}${mayBeZero}`;
}

function stateTable(input: OutlookInput, visa: VisaLabel): StateTable {
  const { points } = visa;
  return {
    visa: visa.visa,
    title: `${visa.visa} by state, at your ${points} points`,
    sub: `${occupationName(input)} invitations issued each month, at or below your ${points} points, over the last ${STATE_WINDOW} months: the latest month with any, and how many months had some.`,
    rows: visa.states.map((state) => ({
      state: state.state,
      latest: state.latest
        ? latestText(state.latest.month, state.latest.count)
        : `None in the last ${STATE_WINDOW} months`,
      months: monthsOfSix(state),
      label: state.label,
      flag: flagNote(state),
      rules: state.rules,
    })),
  };
}

/** What "See the evidence" shows: the published figures behind every label. */
export function buildEvidence(
  input: OutlookInput,
  o: ProfileOutlook,
): Evidence {
  const { core } = input;
  const name = occupationName(input);
  const you = o.points.base;
  const visas = [o.v190, o.v491].filter((v): v is VisaLabel => v !== null);
  return {
    rounds: core ? { you, rows: roundRows(core, you) } : null,
    roundsEmpty: `No 189 round in the published results lists ${name}.`,
    pool: core ? poolOf(input, core, you) : null,
    poolEmpty: `SkillSelect hasn't published any 189 EOI counts for ${name}.`,
    cohort: core ? cohortOf(input, core) : null,
    states: core ? visas.map((visa) => stateTable(input, visa)) : [],
    statesEmpty: `No state invitations are published for ${name}.`,
  };
}
