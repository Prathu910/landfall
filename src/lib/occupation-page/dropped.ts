import { nextMonth } from "../data/months";
import type { MonthKey, OccupationIndexEntry } from "../data/types";
import { formatLongMonth } from "../report/copy";

/**
 * The first month an occupation is missing from the SkillSelect data (the
 * month after its last published one), or null while it is still in it.
 */
export function droppedSince(entry: OccupationIndexEntry): MonthKey | null {
  return entry.lastAsAt ? nextMonth(entry.lastAsAt) : null;
}

/** "Not in the SkillSelect data since November 2026", or null. */
export function droppedNote(entry: OccupationIndexEntry): string | null {
  const since = droppedSince(entry);
  return since
    ? `Not in the SkillSelect data since ${formatLongMonth(since)}`
    : null;
}
