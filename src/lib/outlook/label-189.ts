import type { Interval, OccupationCore, StateVisa, Visa } from "../data/types";
import { parseCountText, sumIntervals } from "../data/published-count";
import { requirementWhy } from "./eligibility";
import { labelName, stampName } from "./labels";
import type { OutlookLabel } from "./labels";

export type Label189 = {
  label: OutlookLabel;
  tooFew: boolean;
  /**
   * The Home Affairs list leaves the occupation off 189, so 189 reads "not
   * open" ("Not available") at every score. Set even when a failed basic
   * requirement decides the label, so a fix is never said to open 189.
   */
  offList: boolean;
  lastThree: number[]; // cut-offs of the last 3 listed rounds, newest first
  ahead: Interval | null; // EOIs with a higher score; null when no pool
  tied: Interval | null;
  why: string;
};

export const MIN_POINTS = 65;
export const CONFIRM = " Confirm your English and skills assessment dates.";
export const OFF_LIST_WHY =
  "This occupation isn't on the Home Affairs list for 189, so 189 isn't available at any score.";
/** The 189 name for an occupation off the list, as on its occupation page. */
export const NOT_AVAILABLE = "Not available";

/**
 * The state visas the federal list still has the occupation for, 190 first:
 * what is left to name when 189 isn't available.
 */
export function stateVisasOnList(list: {
  federal190: boolean;
  federal491: boolean;
}): StateVisa[] {
  const visas: StateVisa[] = [];
  if (list.federal190) visas.push("190");
  if (list.federal491) visas.push("491");
  return visas;
}

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
    offList: false,
    lastThree: [],
    ahead: null,
    tied: null,
    ...rest,
    why: eligible === null ? why + CONFIRM : why,
  };
}

const WORDS = ["no", "one", "two", "three"];

function cutoffPhrase(n: number): string {
  return n === 1 ? "last listed cut-off" : `last ${n} listed cut-offs`;
}

function competitiveWhy(points: number, l3: number[]): string {
  const met = l3.filter((c) => c <= points);
  const unmet = l3.filter((c) => c > points);
  const scope = `your occupation's ${cutoffPhrase(l3.length)}`;
  const metPart =
    met.length === 1
      ? `${l3.length === 2 ? "the lower" : "the lowest"} of ${scope} (${met[0]})`
      : `${WORDS[met.length]} of ${scope} (${met.join(", ")})`;
  const other =
    unmet.length === 1 ? "the other" : `the other ${WORDS[unmet.length]}`;
  return `${points} meets ${metPart} but not ${other} (${unmet.join(", ")}).`;
}

export function label189(input: {
  points: number;
  eligible: boolean | null;
  core: OccupationCore | null;
  /** calculatePoints' ineligibleReasons, so the why names the requirement. */
  reasons?: string[];
  /**
   * The Home Affairs list's 189 flag for the occupation (a code missing from
   * the list is false). Null or absent when the list can't be read: the
   * published data alone then decides.
   */
  listed189?: boolean | null;
}): Label189 {
  const { points, eligible, core } = input;
  const offList = input.listed189 === false;

  // A failed basic requirement closes 190 and 491 too, so it is named first.
  if (eligible === false) {
    return finish("not-eligible", requirementWhy(input.reasons ?? []), true, {
      offList,
    });
  }
  if (offList) return finish("not-open", OFF_LIST_WHY, true, { offList });
  if (points < MIN_POINTS) {
    return finish(
      "not-eligible",
      `${points} is below the 65-point minimum for a 189 invitation.`,
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
  if (points > high && (ahead?.max ?? 0) <= 19) {
    // Without a pool there is no count of higher scores to quote.
    const higher = ahead
      ? ", and fewer than 20 EOIs score higher."
      : ". No 189 pool is published for it.";
    return finish(
      "very-strong",
      `${points} is above your occupation's ${cutoffPhrase(l3.length)} (${cutoffs})${higher}`,
      eligible,
      rest,
    );
  }
  if (points >= high) {
    return finish(
      "strong",
      `${points} meets your occupation's ${cutoffPhrase(l3.length)} (${cutoffs}).`,
      eligible,
      rest,
    );
  }
  if (points >= low) {
    return finish("competitive", competitiveWhy(points, l3), eligible, rest);
  }
  return finish(
    "long-wait",
    `${points} is below your occupation's ${cutoffPhrase(l3.length)} (${cutoffs}).`,
    eligible,
    rest,
  );
}

/** True when 189 reads "Not available": the list, not the data, closes it. */
export function isOffList(v189: Label189): boolean {
  return v189.offList && v189.label === "not-open";
}

/** The 189 label's display name: "Not available" off the list. */
export function name189(v189: Label189): string {
  return isOffList(v189) ? NOT_AVAILABLE : labelName(v189.label, v189.tooFew);
}

/** The 189 label's stamp word: "Not available" off the list. */
export function stampName189(v189: Label189): string {
  return isOffList(v189) ? NOT_AVAILABLE : stampName(v189.label, v189.tooFew);
}

/**
 * True when 189 would read "Not enough data" at any score: no core, or no
 * published pool or listing. Points can't change that, so changes are listed
 * without labels (spec 6.7).
 */
export function no189Data(core: OccupationCore | null): boolean {
  const atPassMark = label189({ points: MIN_POINTS, eligible: true, core });
  return atPassMark.label === "no-data";
}
