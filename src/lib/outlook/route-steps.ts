import { formatDate } from "../migration";
import type { OutlookInput, ProfileOutlook } from "./evaluate-profile";
import type { Move } from "./improve";
import { isAtLeast } from "./labels";
import type { OutlookLabel } from "./labels";
import { joinAnd, moveName } from "./phrases";

export type RouteStep = {
  title: string;
  sub: string;
  points: number | null;
  label: OutlookLabel | null;
};

/** A step with the date it happens; null means now. */
export type Dated = { step: RouteStep; date: string | null };

const MS_PER_DAY = 86_400_000;

export function dated(
  title: string,
  sub: string,
  date: string | null,
  points: number | null = null,
  label: OutlookLabel | null = null,
): Dated {
  return { step: { title, sub, points, label }, date };
}

export function daysBetween(from: string, to: string): number {
  return Math.round((Date.parse(to) - Date.parse(from)) / MS_PER_DAY);
}

export function today(input: OutlookInput, o: ProfileOutlook): Dated {
  return dated(
    "Today",
    formatDate(input.asOf),
    input.asOf,
    o.points.base,
    o.v189.label,
  );
}

/** "EOI submitted" then "Today (N days waiting)": where a lodged route starts. */
export function lodgedStart(input: OutlookInput, o: ProfileOutlook): Dated[] {
  const { eoiDate } = input.profile;
  const days = daysBetween(eoiDate, input.asOf);
  return [
    dated(
      "EOI submitted",
      formatDate(eoiDate),
      eoiDate,
      o.points.base,
      o.v189.label,
    ),
    // An EOI date after today is a typing slip: no days to count.
    dated(
      "Today",
      days >= 0 ? `${days} days waiting` : formatDate(input.asOf),
      input.asOf,
    ),
  ];
}

export function improvementStep(move: Move, retake: boolean): Dated {
  const isEnglish = move.id.startsWith("english");
  const name = moveName(move.title);
  // "English retake" is already the move's own name.
  const asRetake = retake && isEnglish && move.id !== "english-retake";
  const title = asRetake ? "English retake" : name;
  const sub = asRetake ? name : move.detail;
  // A no-data label is no reading at all, so its bubble stays plain.
  const label = move.to.label === "no-data" ? null : move.to.label;
  return dated(title, sub, move.date, move.to.points, label);
}

export function updateEoi(move: Move | undefined, opensNote: boolean): Dated {
  const opens = move && opensNote && isAtLeast(move.to.label, "long-wait");
  const sub = opens ? "189 can open to you" : "the day results arrive";
  return dated("Update your EOI", sub, null);
}

export function invitation(label: OutlookLabel | null): Dated {
  return dated("Invitation", "60 days to lodge", null, null, label);
}

/** "Watch QLD and WA": states whose lists still hold the occupation. */
export function watchListing(o: ProfileOutlook): Dated[] {
  const { states } = o.listMembership;
  return states.length > 0
    ? [dated(`Watch ${joinAnd(states)}`, "they still list you", null)]
    : [];
}
