import { parseCountText, sumIntervals } from "../data/published-count";
import type { Interval, OccupationCore, OccupationDetail } from "../data/types";
import { formatMonth, isMasked, submissionMonth } from "../report/copy";
import { STATE_NAMES } from "../state-outlook/context";
import type { ProfileOutlook } from "./evaluate-profile";
import type { OutlookInput } from "./evaluate-profile";
import { higherScoreCount } from "./label-189";
import type { OutlookLabel } from "./labels";

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
function submittedBefore(
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

/**
 * Spec 6.5. The reader's month stands in for the unpublished date of effect,
 * so the result is an estimate. Null when it cannot be measured.
 */
export function lodgedPace(
  core: OccupationCore,
  detail: OccupationDetail,
  points: number,
  eoiDate: string,
  asOf: string = `${core.asAt}-28`,
): LodgedPace | null {
  const readerMonth = submissionMonth(eoiDate);
  if (!readerMonth || readerMonth > core.asAt) return null;
  const higher = higherScoreCount(core, "189", points);
  const invitedLatest = core.invitedByScore["189"]?.[core.asAt];
  if (!higher || !invitedLatest) return null;
  const pace = parseCountText(invitedLatest[String(points)] ?? "0");
  const roundsPerYear = roundsInLastYear(core, asOf);
  if (pace.max === 0 || isMasked(pace) || roundsPerYear === 0) return null;
  const ahead = sumIntervals([
    higher,
    submittedBefore(detail, points, readerMonth),
  ]);
  return {
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

function roughly(ahead: Interval): string {
  const low = Math.round(ahead.min / 10) * 10;
  const high = Math.round(ahead.max / 10) * 10;
  return low === high ? `${low}` : `${low} to ${high}`;
}

function paceText(pace: LodgedPace, points: number): string {
  const { roundsNeeded: rounds, roundsPerYear } = pace;
  const years = {
    min: Math.max(1, Math.floor(rounds.min / roundsPerYear)),
    max: Math.max(1, Math.ceil(rounds.max / roundsPerYear)),
  };
  return (
    `Roughly ${roughly(pace.ahead)} EOIs ahead. ` +
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
      const round = core?.rounds189.find(
        (r) => r.cutoff !== null && r.cutoff <= points,
      );
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
  return `States don't publish a queue. ${STATE_NAMES[stamp.state]} invited at or below your points in ${best.monthsAtOrBelow6} of the last 6 months.`;
}

export function estimatedWait(
  o: ProfileOutlook,
  input: OutlookInput,
): EstimatedWait {
  const { stamp } = o;
  const state = stateText(o);
  if (state) return { text: state, pace: null };
  if (stamp.kind === "single" && stamp.visa !== "189") {
    return { text: NO_DATA_TEXT, pace: null };
  }

  const { core, detail, profile, asOf } = input;
  const base = o.points.base;
  const lodgeable =
    stamp.kind === "single" &&
    (stamp.label === "strong" || stamp.label === "competitive");
  if (lodgeable && core && detail && profile.eoiDate) {
    const pace = lodgedPace(core, detail, base, profile.eoiDate, asOf);
    if (pace) return { text: paceText(pace, base), pace };
    const month = submissionMonth(profile.eoiDate);
    if (month !== null && month <= core.asAt) {
      return { text: NO_PACE_TEXT, pace: null };
    }
  }
  return { text: plannerText(stamp.label, core, base), pace: null };
}
