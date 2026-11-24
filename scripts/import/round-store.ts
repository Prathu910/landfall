import { existsSync, mkdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { writeFileAtomic } from "./atomic-write";
import type { RoundPages } from "./rounds";

/**
 * Stores a current-round page's HTML at <rawRoot>/rounds/<date>.html, so a
 * round can be re-parsed from its own page after it moves to the
 * previous-rounds page (which drops its tie-breaks and nominations). Atomic;
 * an identical page is left untouched. Returns the path.
 */
export function writeRoundPage(
  rawRoot: string,
  date: string,
  html: string,
): string {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    throw new Error(`Round date must be YYYY-MM-DD, got "${date}"`);
  }
  const dir = join(rawRoot, "rounds");
  const path = join(dir, `${date}.html`);
  if (existsSync(path) && readFileSync(path, "utf8") === html) return path;
  mkdirSync(dir, { recursive: true });
  writeFileAtomic(path, html);
  return path;
}

/**
 * Adds newly parsed rounds to the stored ones. A stored round is kept as it
 * is, never re-derived from the pages (ruling R1): once a round leaves the
 * current-round page its per-row tie-breaks and nominations are gone. A
 * stored round the pages no longer show is kept too. A skip is dropped once
 * its date has a round. With nothing stored, the parsed pages are used.
 */
export function keepStoredRounds(
  stored: RoundPages | null,
  parsed: RoundPages,
): RoundPages {
  if (stored === null) return parsed;
  const storedDates = new Set(stored.rounds.map((round) => round.date));
  const rounds = [
    ...stored.rounds,
    ...parsed.rounds.filter((round) => !storedDates.has(round.date)),
  ].sort((a, b) => b.date.localeCompare(a.date));
  const roundDates = new Set(rounds.map((round) => round.date));
  const skipDates = new Set(stored.skipped.map((skip) => skip.date));
  const skipped = [
    ...parsed.skipped.filter((skip) => !skipDates.has(skip.date)),
    ...stored.skipped,
  ].filter((skip) => !roundDates.has(skip.date));
  return { rounds, skipped };
}
