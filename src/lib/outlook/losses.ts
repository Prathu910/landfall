import type { OccupationCore } from "../data/types";
import { buildTimeline, formatDate } from "../migration";
import type { Profile, TimelineEvent } from "../migration";
import { label189 } from "./label-189";
import type { OutlookLabel } from "./labels";

export type Shift = { points: number; label: OutlookLabel };
export type Loss = {
  date: string;
  title: string;
  detail: string;
  from: Shift;
  to: Shift;
  kind: "points" | "eligibility" | "eoi-expiry";
};

const LOSS_YEARS = 2;

// The timeline has no event ids, so its fixed titles identify these events.
const BASIC =
  "is a basic requirement, not a points loss. Without one you can't be invited for any of the three visas until you";
const NAMED_LOSSES: Record<string, Omit<Loss, "date" | "from" | "to">> = {
  "EOI validity ends": {
    kind: "eoi-expiry",
    title: "EOI expires",
    detail:
      "If you aren't invited by then, you'd have to submit a new EOI, with a new date of effect.",
  },
  "English test validity ends": {
    kind: "eligibility",
    title: "English test expires",
    detail: `A valid English test ${BASIC} retake it.`,
  },
  "Skills assessment validity ends": {
    kind: "eligibility",
    title: "Skills assessment expires",
    detail: `A valid skills assessment ${BASIC} renew it.`,
  },
  "Your 45th birthday": {
    kind: "eligibility",
    title: "Your 45th birthday",
    detail: "You have to be under 45 when you're invited.",
  },
};

/** Null for gains and dates that change no points (a visa expiry). */
function describeLoss(
  event: TimelineEvent,
): Omit<Loss, "date" | "from" | "to"> | null {
  const on = formatDate(event.date);
  const named = NAMED_LOSSES[event.title];
  if (named) return { ...named, title: `${named.title}, ${on}` };
  const delta = event.delta ?? 0;
  if (delta >= 0) return null;
  return {
    kind: "points",
    title: `${event.title}, ${on}: −${-delta}`,
    detail: event.description,
  };
}

/** The reader's 189 position today, where the first loss starts. */
export type LossStart = {
  points: number;
  eligible: boolean | null;
  label: OutlookLabel;
  /** The federal list's 189 flag (label-189.ts listed189). */
  listed189?: boolean | null;
};

/** Timeline losses within 2 years, each starting where the last one left off. */
export function buildLosses(
  profile: Profile,
  asOf: string,
  core: OccupationCore | null,
  start: LossStart,
): Loss[] {
  const limit = `${Number(asOf.slice(0, 4)) + LOSS_YEARS}${asOf.slice(4)}`;
  let { points, eligible, label } = start;
  const losses: Loss[] = [];
  for (const event of buildTimeline(profile, asOf)) {
    const loss = describeLoss(event);
    if (loss === null || event.date > limit) continue;
    const from = { points, label };
    points += event.delta ?? 0;
    if (loss.kind === "eligibility") eligible = false;
    label = label189({
      points,
      eligible,
      core,
      listed189: start.listed189,
    }).label;
    losses.push({ date: event.date, ...loss, from, to: { points, label } });
  }
  return losses;
}
