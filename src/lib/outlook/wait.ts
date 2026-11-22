import { parseCountText, sumIntervals } from "../data/published-count";
import type { Interval, OccupationCore, OccupationDetail } from "../data/types";
import {
  formatMonth,
  formatSummed,
  isMasked,
  submissionMonth,
} from "../report/copy";
import { combinedWait } from "./combined";
import type { OutlookInput, ProfileOutlook } from "./evaluate-profile";
import { higherScoreCount } from "./label-189";
import type { OutlookLabel } from "./labels";
import { capital, monthsOfSix, theState } from "./phrases";

export type LodgedPace = {
  ahead: Interval;
  pace: Interval;
  roundsPerYear: number;
  roundsNeeded: { min: number; max: number };
};

export type EstimatedWait = { text: string; pace: LodgedPace | null };

const NO_DATA_TEXT = "We can't estimate one without data.";
const NO_PACE_TEXT = "No recent invitations at your score to measure a pace.";

/** 189 rounds held in the 12 months up to and including `asOf`. */
function roundsInLastYear(core: OccupationCore, asOf: string): number {
  const earliest = `${Number(asOf.slice(0, 4)) - 1}${asOf.slice(4)}`;
  return core.rounds189.filter((r) => r.date > earliest && r.date <= asOf)
    .length;
}

/** Submitted EOIs at this score from months before the reader's month. */
export function submittedBefore(
  detail: OccupationDetail,
  points: number,
  readerMonth: string,
): Interval {
  const byMonth = detail.cohortsByScore["189"]?.[String(points)] ?? {};
  return sumIntervals(
    Object.entries(byMonth)
      // "older" is before the 36-month window, so it is before the reader.
      .filter(([month]) => month === "older" || month < readerMonth)
      .map(([, text]) => parseCountText(text)),
  );
}

export type LodgedPaceResult =
  | ({ kind: "pace" } & LodgedPace)
  | { kind: "no-pace" } // measured: masked or zero pace, or no rounds this year
  | { kind: "unknown" }; // not measurable: not fetched, no pool, bad date

/**
 * Spec 6.5. The reader's month stands in for the unpublished date of effect,
 * so the result is an estimate. A month missing from invitedByScore was not
 * fetched, so it is "unknown", never a zero pace.
 */
export function lodgedPace(
  core: OccupationCore,
  detail: OccupationDetail,
  points: number,
  eoiDate: string,
  asOf: string,
): LodgedPaceResult {
  const readerMonth = submissionMonth(eoiDate);
  if (!readerMonth || readerMonth > core.asAt) return { kind: "unknown" };
  const higher = higherScoreCount(core, "189", points);
  const invitedLatest = core.invitedByScore["189"]?.[core.asAt];
  if (!higher || !invitedLatest) return { kind: "unknown" };
  const pace = parseCountText(invitedLatest[String(points)] ?? "0");
  const roundsPerYear = roundsInLastYear(core, asOf);
  if (pace.max === 0 || isMasked(pace) || roundsPerYear === 0) {
    return { kind: "no-pace" };
  }
  const ahead = sumIntervals([
    higher,
    submittedBefore(detail, points, readerMonth),
  ]);
  return {
    kind: "pace",
    ahead,
    pace,
    roundsPerYear,
    roundsNeeded: {
      min: Math.floor(ahead.min / pace.max),
      max: Math.ceil(ahead.max / pace.min),
    },
  };
}

function range(min: number, max: number, unit: string): string {
  return min === max ? `${min} ${unit}` : `${min} to ${max} ${unit}s`;
}

function toTen(value: number): number {
  // Under 10 stays exact, so a small count never rounds down to zero.
  return value < 10 ? value : Math.round(value / 10) * 10;
}

/**
 * An estimate to the nearest ten: "870 to 970". A count from zero is a sum
 * of masked cells, so it reads "under 39" (ruling R20), never "0 to 40".
 */
export function roughly(ahead: Interval): string {
  if (ahead.min === 0) return ahead.max === 0 ? "0" : formatSummed(ahead);
  const low = toTen(ahead.min);
  const high = toTen(ahead.max);
  return low === high ? `${low}` : `${low} to ${high}`;
}

/** Sentence-initial: "Roughly 870 to 970 EOIs", "Under 39 EOIs" or "No EOIs". */
export function roughlyEois(ahead: Interval): string {
  if (ahead.max === 0) return "No EOIs";
  if (ahead.min === 0) return `${capital(formatSummed(ahead))} EOIs`;
  return `Roughly ${roughly(ahead)} EOIs`;
}

/** Mid-sentence: "about 50 to 60", "under 39" or "none"; never "about 0". */
export function aboutCount(count: Interval): string {
  if (count.max === 0) return "none";
  if (count.min === 0) return formatSummed(count);
  return `about ${roughly(count)}`;
}

function paceText(pace: LodgedPace, points: number): string {
  const { roundsPerYear } = pace;
  // At least one round: the reader still waits for the next one.
  const rounds = {
    min: Math.max(1, pace.roundsNeeded.min),
    max: Math.max(1, pace.roundsNeeded.max),
  };
  const years = {
    min: Math.max(1, Math.floor(rounds.min / roundsPerYear)),
    max: Math.max(1, Math.ceil(rounds.max / roundsPerYear)),
  };
  return (
    `${roughlyEois(pace.ahead)} ahead. ` +
    `At the latest pace, about ${range(rounds.min, rounds.max, "round")}, ` +
    `so plan for ${range(years.min, years.max, "year")} at ${points} (estimate).`
  );
}

function plannerText(
  label: OutlookLabel,
  core: OccupationCore | null,
  points: number,
): string {
  switch (label) {
    case "very-strong":
      return "The next 189 round.";
    case "strong":
      return "The next 1 to 2 rounds.";
    case "competitive": {
      const listed = core?.rounds189.filter((r) => r.cutoff !== null) ?? [];
      const round =
        listed.find((r) => r.cutoff === points) ??
        listed.find((r) => (r.cutoff as number) <= points);
      return round
        ? `Uncertain. Possible in a round that goes down to ${points}, like ${formatMonth(round.date.slice(0, 7))}.`
        : `Uncertain. Possible in a round that goes down to ${points}.`;
    }
    case "long-wait":
      return "Unlikely without more points.";
    case "not-invited":
      return "No 189 invitations to measure.";
    case "not-eligible":
      return "189: not possible until you reach 65.";
    default:
      return NO_DATA_TEXT;
  }
}

function stateText(o: ProfileOutlook): string | null {
  const { stamp } = o;
  if (stamp.kind !== "single" || stamp.visa === "189" || !stamp.state) {
    return null;
  }
  const best = (stamp.visa === "190" ? o.v190 : o.v491)?.best;
  if (!best) return null;
  return `States don't publish a queue. ${capital(theState(stamp.state))} invited at or below your points in ${monthsOfSix(best)}.`;
}

export function estimatedWait(
  o: ProfileOutlook,
  input: OutlookInput,
): EstimatedWait {
  const { stamp } = o;
  const state = stateText(o);
  if (state) return { text: state, pace: null };
  const combined = stamp.kind === "combined" ? combinedWait(o) : null;
  if (combined) return { text: combined, pace: null };
  if (stamp.kind === "single" && stamp.visa !== "189") {
    return { text: NO_DATA_TEXT, pace: null };
  }

  const { core, detail, profile, asOf } = input;
  const base = o.points.base;
  const lodgeable =
    stamp.kind === "single" &&
    (stamp.label === "strong" || stamp.label === "competitive");
  if (lodgeable && core && detail && profile.eoiDate) {
    const result = lodgedPace(core, detail, base, profile.eoiDate, asOf);
    if (result.kind === "no-pace") return { text: NO_PACE_TEXT, pace: null };
    if (result.kind === "pace") {
      const pace: LodgedPace = {
        ahead: result.ahead,
        pace: result.pace,
        roundsPerYear: result.roundsPerYear,
        roundsNeeded: result.roundsNeeded,
      };
      return { text: paceText(pace, base), pace };
    }
  }
  return { text: plannerText(stamp.label, core, base), pace: null };
}
