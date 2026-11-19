import { parseCountText, sumIntervals } from "../data/published-count";
import { poolPosition } from "../data/pool-position";
import type { Interval, OccupationCore, StateCode } from "../data/types";
import { formatDate } from "../migration";
import { formatCount, formatMonth } from "../report/copy";
import { summarise189Rounds } from "../report/round-status";
import { STATE_NAMES, joinWords } from "../state-outlook/context";
import { pointsRange } from "./charts";
import type { StateRow } from "./states";
import { mostCommonScore } from "./summary";

export type Faq = { question: string; answer: string };

const CHECKING = "Rules being checked";
const HISTORY_NOTE = "Past cut-offs are history, not a promise.";

function whenLastInvited(core: OccupationCore): Faq {
  const { name } = core;
  const summary = summarise189Rounds(core.rounds189);
  const last = summary.latestCutoff;
  const answer = last
    ? `The last 189 round that listed ${name} was on ${formatDate(last.date)}, with a cut-off of ${last.cutoff} points.`
    : `No 189 round we can read has listed ${name}.`;
  return { question: `When did 189 last invite ${name}?`, answer };
}

function stateInvited190(
  core: OccupationCore,
  state: StateCode,
): Interval | null {
  const month = core.stateInvited["190"]?.[state]?.[core.asAt];
  if (!month) return null;
  return sumIntervals(Object.values(month).map(parseCountText));
}

/**
 * R8: the state with the most EOIs in invited status for 190, named only when
 * its range sits strictly above every other published state's range.
 */
function mostInvitedSentence(
  core: OccupationCore,
  rows: StateRow[],
): string | null {
  const counts = rows.flatMap((r) => {
    const count = stateInvited190(core, r.state);
    return count ? [{ state: r.state, count }] : [];
  });
  const top = counts.reduce<(typeof counts)[number] | null>(
    (best, c) => (!best || c.count.min > best.count.min ? c : best),
    null,
  );
  if (!top || top.count.min <= 0) return null;
  const clear = counts.every((c) => c === top || top.count.min > c.count.max);
  if (!clear) return null;
  return `${STATE_NAMES[top.state]} had the most EOIs in invited status for 190, as at ${formatMonth(core.asAt)} (${formatCount(top.count)}).`;
}

/** "NSW and QLD list it for 190", "WA lists it for 190 and 491". */
function listing(rows: StateRow[], visas: string): string | null {
  const codes = rows.filter((r) => r.onList === visas).map((r) => r.state);
  if (codes.length === 0) return null;
  return `${joinWords(codes, "and")} ${codes.length === 1 ? "lists" : "list"} it for ${visas}`;
}

function whichStates(core: OccupationCore, rows: StateRow[]): Faq {
  const { name } = core;
  const parts = ["190 and 491", "190", "491"].flatMap(
    (visas) => listing(rows, visas) ?? [],
  );
  const checked = rows.filter((r) => r.onList !== CHECKING);
  const pending = rows.filter((r) => r.onList === CHECKING);
  const sentences: string[] = [];
  if (parts.length > 0) {
    sentences.push(`For 2026–27, ${parts.join("; ")}.`);
  } else {
    sentences.push(
      `None of ${joinWords(
        checked.map((r) => r.state),
        "and",
      )} lists it for 2026–27.`,
    );
  }
  if (pending.length > 0) {
    sentences.push(
      `${joinWords(
        pending.map((r) => r.state),
        "and",
      )} rules are still being checked.`,
    );
  }
  const most = mostInvitedSentence(core, rows);
  if (most) sentences.push(most);
  return {
    question: `Which states nominate ${name}?`,
    answer: sentences.join(" "),
  };
}

function pointsEnough(core: OccupationCore): Faq | null {
  const pool = core.pool["189"];
  const common = pool && mostCommonScore(pool.byScore);
  if (!pool || !common) return null;
  const score = common.score;
  const position = poolPosition(core, null, "189", score, null);
  if (!position.available) return null;
  const summary = summarise189Rounds(core.rounds189);
  const higher = `In the ${formatMonth(core.asAt)} snapshot, ${formatCount(position.higher)} EOIs in the pool hold more than ${score} points.`;
  const listed = core.rounds189
    .slice(0, 4)
    .flatMap((r) => (r.cutoff === null ? [] : [r.cutoff]));
  const last = summary.latestCutoff;
  const range =
    summary.status !== "none"
      ? `In its last four rounds, 189 listed ${core.name} at ${pointsRange(listed)} points.`
      : last
        ? `189 has no recent cut-off for ${core.name}; the last was ${last.cutoff} points.`
        : `189 hasn't listed ${core.name} in any round we can read.`;
  return {
    question: `Is ${score} points enough for ${core.name} 189?`,
    answer: `${range} ${higher} ${HISTORY_NOTE}`,
  };
}

export function occupationFaq(core: OccupationCore, rows: StateRow[]): Faq[] {
  const points = pointsEnough(core);
  return [
    whenLastInvited(core),
    whichStates(core, rows),
    ...(points ? [points] : []),
  ];
}
