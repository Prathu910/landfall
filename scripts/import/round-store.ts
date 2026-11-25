import { existsSync, mkdirSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
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
  const path = roundPagePath(rawRoot, date);
  if (existsSync(path) && readFileSync(path, "utf8") === html) return path;
  mkdirSync(dirname(path), { recursive: true });
  writeFileAtomic(path, html);
  return path;
}

function roundPagePath(rawRoot: string, date: string): string {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    throw new Error(`Round date must be YYYY-MM-DD, got "${date}"`);
  }
  return join(rawRoot, "rounds", `${date}.html`);
}

/**
 * "kept": the round is already in rounds.json and its saved page differs
 * from the one just read, so the saved page was left as it is.
 */
export type RoundPageWrite = {
  path: string;
  status: "saved" | "unchanged" | "kept";
};

/**
 * Saves the current round's page, unless that round is already stored and
 * its page is saved. rounds.json keeps a stored round verbatim (ruling R1),
 * so its saved page must stay the one it was parsed from: a later copy is
 * never written over it, even if Home Affairs has edited the page since. A
 * round not yet stored may be saved again (a run that failed validation
 * wrote its page but not rounds.json).
 */
export function storeCurrentRoundPage(
  rawRoot: string,
  storedDates: ReadonlySet<string>,
  date: string,
  html: string,
): RoundPageWrite {
  const path = roundPagePath(rawRoot, date);
  if (existsSync(path)) {
    if (readFileSync(path, "utf8") === html) {
      return { path, status: "unchanged" };
    }
    if (storedDates.has(date)) return { path, status: "kept" };
  }
  return { path: writeRoundPage(rawRoot, date, html), status: "saved" };
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
