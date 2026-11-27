/**
 * SERVER ONLY. Uses node `fs`; import only from Server Components, build-time
 * code and scripts, never from a "use client" module.
 */
import { existsSync, readFileSync, readdirSync } from "node:fs";
import path from "node:path";
import type { MonthKey } from "../data/types";
import { isRecapFacts } from "./guards";
import type { RecapFacts } from "./types";
import { latestRound, type LatestRound } from "./latest-round";

export const UPDATES_DIR = path.join(process.cwd(), "src", "data", "updates");
const FILE_PATTERN = /^(\d{4}-\d{2})\.json$/;

/** The months that have a facts file, newest first. */
export function listRecapMonths(dir: string = UPDATES_DIR): MonthKey[] {
  if (!existsSync(dir)) return [];
  return readdirSync(dir)
    .map((name) => FILE_PATTERN.exec(name)?.[1])
    .filter((month): month is MonthKey => month !== undefined)
    .sort()
    .reverse();
}

/** One month's facts file; throws if it is missing or invalid. */
export function loadRecap(
  month: MonthKey,
  dir: string = UPDATES_DIR,
): RecapFacts {
  const file = path.join(dir, `${month}.json`);
  const value: unknown = JSON.parse(readFileSync(file, "utf8"));
  if (!isRecapFacts(value) || value.month !== month) {
    throw new Error(`${file} is not a valid facts file for ${month}`);
  }
  return value;
}

/** The newest 189 round in the facts files, for pages that quote it. */
export function loadLatestRound(dir: string = UPDATES_DIR): LatestRound | null {
  return latestRound(
    listRecapMonths(dir).map((month) => loadRecap(month, dir)),
  );
}
