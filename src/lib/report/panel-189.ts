import { poolPosition } from "../data/pool-position";
import type {
  Interval,
  MonthKey,
  OccupationCore,
  OccupationDetail,
  Visa,
} from "../data/types";
import { formatDate } from "../migration";
import {
  countClause,
  countInSentence,
  formatMonth,
  submissionMonth,
} from "./copy";

export type QueueSegments = {
  ahead: Interval;
  same: Interval;
  lower: Interval;
  total: Interval;
};

export type WhereYouStand =
  { segments: QueueSegments; sentence: string } | { unavailable: string };

export type SameScore =
  | { kind: "split"; sentence: string; note: string }
  | { kind: "prompt"; text: string }
  | { kind: "unavailable"; text: string }
  | { kind: "loading" };

export type RoundTile = {
  date: string;
  label: string;
  value: string;
  listed: boolean;
};

export type RoundsBlock = {
  tiles: RoundTile[];
  all: RoundTile[];
  skippedNote: string | null;
  note: string;
};

const TILE_COUNT = 6;

const SAME_SCORE_NOTE =
  "Approximate: ties are broken by date of effect, which isn't published and can differ from the submission month.";
const SAME_SCORE_PROMPT =
  "Add your EOI date to see how many same-score EOIs were submitted before yours.";
const SAME_SCORE_UNAVAILABLE =
  "Published counts by submission month aren't available at your score.";
const ROUNDS_NOTE =
  "“Not listed” means the official results didn't include this occupation. It is not a cut-off of zero.";

export function buildWhereYouStand(
  core: OccupationCore,
  score: number,
  visa: Visa = "189",
): WhereYouStand {
  const position = poolPosition(core, null, visa, score, null);
  if (!position.available) {
    return {
      unavailable: `No ${visa} EOIs are published for this occupation in this snapshot.`,
    };
  }
  const { higher: ahead, same, total } = position;
  const lower: Interval = {
    min: Math.max(0, total.min - ahead.max - same.max),
    max: Math.max(0, total.max - ahead.min - same.min),
  };
  return {
    segments: { ahead, same, lower, total },
    sentence: [
      countClause(ahead, " EOIs have a higher score"),
      countClause(same, ` share your ${position.score} points`),
      countClause(
        total,
        " EOIs",
        "The pool holds ",
        ` as at ${formatMonth(core.asAt)}`,
      ),
    ].join(" "),
  };
}

export function buildSameScore(
  core: OccupationCore,
  detail: OccupationDetail | null,
  score: number,
  submittedMonth: MonthKey | null,
  asOf: string,
): SameScore {
  const prompt: SameScore = { kind: "prompt", text: SAME_SCORE_PROMPT };
  const asOfMonth = submissionMonth(asOf);
  if (!submittedMonth || (asOfMonth && submittedMonth > asOfMonth)) {
    return prompt;
  }
  if (!detail) return { kind: "loading" };
  const position = poolPosition(core, detail, "189", score, submittedMonth);
  if (!position.available || !position.sameSubmitted) {
    return { kind: "unavailable", text: SAME_SCORE_UNAVAILABLE };
  }
  const { before, sameMonth, after } = position.sameSubmitted;
  return {
    kind: "split",
    sentence: `About ${countInSentence(before)} were submitted before ${formatMonth(submittedMonth)}, ${countInSentence(sameMonth)} in the same month and ${countInSentence(after)} after.`,
    note: SAME_SCORE_NOTE,
  };
}

function skippedNote(count: number): string | null {
  if (count === 0) return null;
  return count === 1
    ? "1 older round uses a different table layout and is not shown."
    : `${count} older rounds use a different table layout and are not shown.`;
}

export function buildRounds(
  core: OccupationCore,
  skippedRounds: { date: string }[],
): RoundsBlock {
  const all = core.rounds189.map((round) => ({
    date: round.date,
    label: formatDate(round.date),
    value: round.cutoff === null ? "Not listed" : `${round.cutoff} pts`,
    listed: round.cutoff !== null,
  }));
  return {
    tiles: all.slice(0, TILE_COUNT),
    all,
    skippedNote: skippedNote(skippedRounds.length),
    note: ROUNDS_NOTE,
  };
}
