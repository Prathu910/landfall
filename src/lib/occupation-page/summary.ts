import { calendarMonths } from "../data/months";
import { parseCountText } from "../data/published-count";
import { monthEnd } from "../data/report-source";
import type {
  CountText,
  OccupationCore,
  OccupationDetail,
  ScoreCounts,
} from "../data/types";
import { formatDate } from "../migration";
import { formatInterval } from "../pool";
import { countInSentence, formatMonth } from "../report/copy";
import { buildEoisLikeYours } from "../report/eois-like-yours";
import {
  CHIP_LABEL,
  summarise189Rounds,
  type Round,
  type RoundStatus,
} from "../report/round-status";
import type { FederalList } from "../state-outlook/rules-types";
import { dated189Sentence, datedLead, statesSentence } from "./answer";
import type { StateRow } from "./states";

export type ChipTone = "red" | "amber" | "green" | "neutral";
export type StatusChip = { label: string; tone: ChipTone };

// Same mapping as the scorecard's 189 chip (report/scorecard.ts).
const STATUS_TONE: Record<RoundStatus, ChipTone> = {
  none: "red",
  occasional: "amber",
  regular: "green",
};

/** 189 has something to show: a published pool, or a listed cut-off in the last 8 rounds. */
export function has189Rounds(core: OccupationCore): boolean {
  return (
    Boolean(core.pool["189"]) ||
    core.rounds189.slice(0, 8).some((r) => r.cutoff !== null)
  );
}

export function sourceLine(core: OccupationCore): string {
  return `SkillSelect (Department of Home Affairs), snapshot ${formatDate(monthEnd(core.asAt))} · counts are EOIs (one person can hold several) · updated monthly`;
}

function cutoffRange(rounds: Round[]): string {
  const listed = rounds.flatMap((r) => (r.cutoff === null ? [] : [r.cutoff]));
  const lo = Math.min(...listed);
  const hi = Math.max(...listed);
  return lo === hi ? `${lo}` : `${lo}–${hi}`;
}

export function roundsSentence(name: string, rounds189: Round[]): string {
  const summary = summarise189Rounds(rounds189);
  const lastFour = rounds189.slice(0, 4);
  const span =
    summary.roundsConsidered === 4 ? "four" : `${summary.roundsConsidered}`;
  if (summary.status === "none") {
    const last = summary.latestCutoff;
    if (!last) return `189 hasn't listed ${name} in any round we can read.`;
    return `189 hasn't listed ${name} in its last ${span} rounds; the last cut-off was ${last.cutoff} points, in ${formatMonth(last.date.slice(0, 7))}.`;
  }
  const points = cutoffRange(lastFour);
  if (summary.status === "regular") {
    return `189 listed ${name} in each of its last ${span} rounds, at ${points} points.`;
  }
  return `189 listed ${name} in ${summary.listedInLastFour} of its last ${span} rounds, at ${points} points.`;
}

export function mostCommonScore(
  byScore: ScoreCounts,
): { score: number; count: number } | null {
  let best: { score: number; count: number } | null = null;
  for (const [key, text] of Object.entries(byScore)) {
    if (!/^\d+$/.test(text)) continue; // "<20" cells are not a single number
    const score = Number(key);
    const count = Number(text);
    if (
      !best ||
      count > best.count ||
      (count === best.count && score < best.score)
    ) {
      best = { score, count };
    }
  }
  return best;
}

function holds(total: CountText): string {
  const interval = parseCountText(total);
  const text = countInSentence(interval);
  return text === formatInterval(interval)
    ? `${text} EOIs`
    : "under 20 EOIs (so may be zero)";
}

function otherPools(core: OccupationCore): string {
  const parts = (["190", "491"] as const).flatMap((visa) => {
    const pool = core.pool[visa];
    return pool ? [`the ${visa} pool holds ${holds(pool.total)}`] : [];
  });
  return parts.length ? `; ${parts.join(" and ")}.` : ".";
}

/** `offList`: the Home Affairs list leaves the occupation off 189. */
export function poolSentence(
  name: string,
  core: OccupationCore,
  offList = false,
): string {
  const pool = core.pool["189"];
  if (!pool && offList) {
    return `${name} isn't on the Home Affairs list for 189${otherPools(core)}`;
  }
  if (!pool) {
    return `No 189 EOIs are waiting in the published pool for ${name}${otherPools(core)}`;
  }
  const lead = `The 189 pool holds ${holds(pool.total)}`;
  const common = mostCommonScore(pool.byScore);
  if (!common) return `${lead}.`;
  return `${lead}; the most common score is ${common.score} points (${formatInterval({ min: common.count, max: common.count })} EOIs).`;
}

export function likeTheseSentence(
  name: string,
  core: OccupationCore,
  detail: OccupationDetail | null,
): string | null {
  if (!detail) return null;
  const result = buildEoisLikeYours({
    occupationName: name,
    core,
    detail,
    submittedMonth: calendarMonths(core.asAt, 7)[0],
    asOf: monthEnd(core.asAt),
  });
  return result.kind === "ready" ? result.sentence : null;
}

/**
 * The federal list's 189 flag for a code (a missing code is off the list),
 * or null when the list can't be read.
 */
export function listed189(
  code: string,
  federal: FederalList | null,
): boolean | null {
  return federal ? federal.entries[code]?.["189"] === true : null;
}

/**
 * Every code the federal list flags for 189, for a client that checks codes
 * without importing the list; null when the list can't be read.
 */
export function listed189Codes(federal: FederalList | null): string[] | null {
  if (!federal) return null;
  return Object.keys(federal.entries).filter(
    (code) => federal.entries[code]["189"] === true,
  );
}

/**
 * The opening answer: a dated 189 sentence with the code, the pool, the
 * 190 and 491 states (when `rows` are given) and, with detail, what
 * happened to EOIs like these.
 */
export function occupationSummary(
  core: OccupationCore,
  detail: OccupationDetail | null,
  federal: FederalList | null = null,
  rows: StateRow[] | null = null,
): string[] {
  const { name } = core;
  const offList = listed189(core.code, federal) === false;
  const states = rows ? statesSentence(core, rows) : null;
  // Without a 189 pool the page leads with 190/491; recent 189 rounds follow.
  const sentences: (string | null)[] = core.pool["189"]
    ? [
        dated189Sentence(core),
        poolSentence(name, core),
        states,
        likeTheseSentence(name, core, detail),
      ]
    : [
        datedLead(core, poolSentence(name, core, offList)),
        has189Rounds(core) ? roundsSentence(name, core.rounds189) : null,
        states,
      ];
  return sentences.filter((s): s is string => s !== null);
}

export function statusChips(
  core: OccupationCore,
  federal: FederalList | null,
): StatusChip[] {
  const chips: StatusChip[] = [];
  if (has189Rounds(core)) {
    const status = summarise189Rounds(core.rounds189).status;
    chips.push({
      label: `189: ${CHIP_LABEL[status]}`,
      tone: STATUS_TONE[status],
    });
  }
  const entry = federal?.entries[core.code];
  if (entry) {
    for (const visa of ["190", "491"] as const) {
      chips.push({
        label: entry[visa]
          ? `${visa}: on federal list`
          : `Not on the federal list for ${visa}`,
        tone: "neutral",
      });
    }
  }
  return chips;
}
