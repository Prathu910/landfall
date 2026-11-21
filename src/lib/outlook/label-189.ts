import type { Interval, OccupationCore, Visa } from "../data/types";
import { parseCountText, sumIntervals } from "../data/published-count";
import type { OutlookLabel } from "./labels";

export type Label189 = {
  label: OutlookLabel;
  tooFew: boolean;
  lastThree: number[]; // cut-offs of the last 3 listed rounds, newest first
  ahead: Interval | null; // EOIs with a higher score; null when no pool
  tied: Interval | null;
  why: string;
};

const MIN_POINTS = 65;
const CONFIRM = " Confirm your English and skills assessment dates.";

/** EOIs in the pool with a score above `points`. Null when there is no pool. */
export function higherScoreCount(
  core: OccupationCore,
  visa: Visa,
  points: number,
): Interval | null {
  const pool = core.pool[visa];
  if (!pool) return null;
  return sumIntervals(
    Object.entries(pool.byScore)
      .filter(([score]) => Number(score) > points)
      .map(([, text]) => parseCountText(text)),
  );
}

function countAt(core: OccupationCore, points: number): Interval | null {
  const pool = core.pool["189"];
  if (!pool) return null;
  const text = pool.byScore[String(points)];
  return text === undefined ? { min: 0, max: 0 } : parseCountText(text);
}

function everyCountMasked(core: OccupationCore): boolean {
  const pool = core.pool["189"];
  if (!pool) return false;
  const texts = [pool.total, ...Object.values(pool.byScore)];
  return texts.every((t) => t === "<20");
}

function list(values: number[]): string {
  return values.length === 2
    ? `${values[0]} and ${values[1]}`
    : values.join(", ");
}

function finish(
  label: OutlookLabel,
  why: string,
  eligible: boolean | null,
  rest: Partial<Label189> = {},
): Label189 {
  return {
    label,
    tooFew: false,
    lastThree: [],
    ahead: null,
    tied: null,
    ...rest,
    why: eligible === null ? why + CONFIRM : why,
  };
}

function competitiveWhy(points: number, l3: number[]): string {
  const lowest = Math.min(...l3);
  const others = l3.filter((_, i) => i !== l3.indexOf(lowest));
  if (others.length === 0) {
    return `${points} meets your occupation's last listed cut-off (${lowest}).`;
  }
  return `${points} meets the lowest of your occupation's last ${l3.length} listed cut-offs (${lowest}) but not the ${others.length === 1 ? "other" : "other " + numberWord(others.length)} (${others.join(", ")}).`;
}

function numberWord(n: number): string {
  return n === 2 ? "two" : String(n);
}

export function label189(input: {
  points: number;
  eligible: boolean | null;
  core: OccupationCore | null;
}): Label189 {
  const { points, eligible, core } = input;

  if (eligible === false || points < MIN_POINTS) {
    return finish(
      "not-eligible",
      eligible === false
        ? "You don't meet the basic age, English or skills assessment requirements yet."
        : `${points} is below the 65-point minimum for a 189 invitation.`,
      true,
    );
  }
  if (!core) {
    return finish(
      "no-data",
      "There is no published data for this occupation.",
      eligible,
    );
  }

  const rounds = core.rounds189;
  const listed = rounds.filter((r) => r.cutoff !== null);
  const hasPool = core.pool["189"] !== undefined;
  if (!hasPool && listed.length === 0) {
    return finish(
      "no-data",
      "No published 189 pool or invitation round lists this occupation.",
      eligible,
    );
  }
  if (listed.length === 0 && everyCountMasked(core)) {
    return finish(
      "no-data",
      "Every published 189 count for this occupation is under 20, too few to read.",
      eligible,
      { tooFew: true, ahead: higherScoreCount(core, "189", points) },
    );
  }

  const ahead = hasPool ? higherScoreCount(core, "189", points) : null;
  const tied = countAt(core, points);
  const l3 = listed.slice(0, 3).map((r) => r.cutoff as number);
  const rest = { lastThree: l3, ahead, tied };

  const lastFour = rounds.slice(0, 4);
  if (
    listed.length === 0 ||
    (lastFour.length > 0 && lastFour.every((r) => r.cutoff === null))
  ) {
    return finish(
      "not-invited",
      "Your occupation wasn't listed in any of the last 4 invitation rounds.",
      eligible,
      rest,
    );
  }

  const high = Math.max(...l3);
  const low = Math.min(...l3);
  const cutoffs = list(l3);
  if (points > high && ahead !== null && ahead.max <= 19) {
    return finish(
      "very-strong",
      `${points} is above your occupation's last ${l3.length} listed cut-offs (${cutoffs}), and fewer than 20 EOIs score higher.`,
      eligible,
      rest,
    );
  }
  if (points >= high) {
    return finish(
      "strong",
      `${points} meets your occupation's last ${l3.length} listed cut-offs (${cutoffs}).`,
      eligible,
      rest,
    );
  }
  if (points >= low) {
    return finish("competitive", competitiveWhy(points, l3), eligible, rest);
  }
  return finish(
    "long-wait",
    `${points} is below your occupation's last ${l3.length} listed cut-offs (${cutoffs}).`,
    eligible,
    rest,
  );
}
