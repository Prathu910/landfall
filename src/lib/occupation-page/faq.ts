import { parseCountText, sumIntervals } from "../data/published-count";
import { poolPosition } from "../data/pool-position";
import type {
  Interval,
  OccupationCore,
  StateCode,
  StateVisa,
} from "../data/types";
import { formatDate } from "../migration";
import { formatCount, formatMonth, isMasked } from "../report/copy";
import { summarise189Rounds } from "../report/round-status";
import { STATE_NAMES, joinWords } from "../state-outlook/context";
import type { FederalList } from "../state-outlook/rules-types";
import { stateListClause } from "./answer";
import { pointsRange } from "./charts";
import type { StateRow } from "./states";
import { mostCommonScore } from "./summary";

export type Faq = { question: string; answer: string };

const CHECKING = "Rules being checked";
const HISTORY_NOTE = "Past cut-offs are history, not a promise.";

function latestCutoff(core: OccupationCore, tieBreak: string | null): Faq {
  const { name } = core;
  const last = summarise189Rounds(core.rounds189).latestCutoff;
  const tie = tieBreak
    ? ` That round's published tie-break date for ${name} was ${formatDate(tieBreak)}: at the cut-off score, the date of effect decides the order.`
    : "";
  const answer = last
    ? `The latest 189 round to list ${name} was on ${formatDate(last.date)}, with a cut-off of ${last.cutoff} points.${tie} ${HISTORY_NOTE}`
    : `No 189 round we can read has listed ${name}, so there is no cut-off to give.`;
  return { question: `What is the latest 189 cut-off for ${name}?`, answer };
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

function whichStates(core: OccupationCore, rows: StateRow[]): Faq {
  const { name } = core;
  const pending = rows.filter((r) => r.onList === CHECKING);
  const list = stateListClause(rows);
  const sentences: string[] = list ? [`${list}.`] : [];
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

/** "How many {name} EOIs are in the 190 pool?", only where the pool is published. */
function poolFaq(core: OccupationCore, visa: StateVisa): Faq | null {
  const pool = core.pool[visa];
  if (!pool) return null;
  const total = parseCountText(pool.total);
  const holds = isMasked(total)
    ? "under 20 EOIs (so it may be zero)"
    : `${formatCount(total)} EOIs`;
  const common = mostCommonScore(pool.byScore);
  const score = common
    ? `; the most common score is ${common.score} points (${formatCount({ min: common.count, max: common.count })} EOIs)`
    : "";
  return {
    question: `How many ${core.name} EOIs are in the ${visa} pool?`,
    answer: `The ${visa} pool holds ${holds} as at ${formatMonth(core.asAt)}${score}. Counts are EOIs, not individuals: one person can hold several, in more than one pool.`,
  };
}

/** "Can I get PR with {name} as my occupation?" from the Home Affairs list: a listing fact, never an outlook. */
function canGetPr(
  core: OccupationCore,
  federal: FederalList | null,
): Faq | null {
  if (!federal) return null;
  const entry = federal.entries[core.code];
  const visas = (["189", "190", "491"] as const).filter((v) => entry?.[v]);
  const checked = formatDate(federal.checkedAt);
  const answer =
    visas.length > 0
      ? `${core.name} is on the Home Affairs skilled occupation list for the ${joinWords([...visas], "and")} (checked ${checked}). Being listed is one requirement; an invitation also depends on your points and on 189 rounds or state selection.`
      : `${core.name} isn't on the Home Affairs skilled occupation list for the 189, 190 or 491 (checked ${checked}), so it can't be used for these points-tested visas.`;
  // No article: ANZSCO names are often plural ("Registered Nurses nec") (R10).
  return {
    question: `Can I get PR with ${core.name} as my occupation?`,
    answer,
  };
}

/** "How many points do I need for {name}?": the pass mark and the last three listed cut-offs. */
function pointsNeeded(core: OccupationCore): Faq {
  const listed = core.rounds189
    .flatMap((r) => (r.cutoff === null ? [] : [r]))
    .slice(0, 3);
  const history =
    listed.length > 0
      ? `The latest 189 cut-offs for ${core.name} were ${joinWords(
          listed.map((r) => `${r.cutoff} points (${formatDate(r.date)})`),
          "and",
        )}.`
      : `189 hasn't listed ${core.name} in any round we can read.`;
  return {
    question: `How many points do I need for ${core.name}?`,
    answer: `At least 65 points to be invited, the pass mark for the 189, 190 and 491. ${history} ${HISTORY_NOTE}`,
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

export function occupationFaq(
  core: OccupationCore,
  rows: StateRow[],
  options: {
    federal?: FederalList | null;
    /** The latest listed round's tie-break date for this occupation, if published. */
    tieBreak?: string | null;
  } = {},
): Faq[] {
  const optional = [
    pointsEnough(core),
    pointsNeeded(core),
    poolFaq(core, "190"),
    poolFaq(core, "491"),
    canGetPr(core, options.federal ?? null),
  ];
  return [
    latestCutoff(core, options.tieBreak ?? null),
    whichStates(core, rows),
    ...optional.filter((f): f is Faq => f !== null),
  ];
}
