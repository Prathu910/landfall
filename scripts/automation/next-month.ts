// Usage: tsx scripts/automation/next-month.ts --newest YYYY-MM [--requested YYYY-MM]
// Prints the month the monthly job should import, or nothing when there is none.
import { readFileSync } from "node:fs";
import { nextMonth } from "../../src/lib/data/months";
import type { MonthKey } from "../../src/lib/data/types";

/**
 * The month to import: the one asked for, else the month after the stored
 * snapshot (the oldest missing month, never the newest) while the dashboard
 * has something newer. Null means nothing to do.
 */
export function nextImportMonth(
  manifestAsAt: MonthKey,
  newest: MonthKey,
  requested: MonthKey | null,
): MonthKey | null {
  if (requested !== null) return requested;
  // MonthKey strings compare in calendar order.
  return newest > manifestAsAt ? nextMonth(manifestAsAt) : null;
}

const MONTH = /^\d{4}-(0[1-9]|1[0-2])$/;

export function parseNextMonthArgs(argv: string[]): {
  newest: MonthKey;
  requested: MonthKey | null;
} {
  let newest: string | undefined;
  let requested: string | undefined;
  for (let i = 0; i < argv.length; i++) {
    if (argv[i] === "--newest") newest = argv[++i];
    else if (argv[i] === "--requested") requested = argv[++i];
    else throw new Error(`Unknown argument "${argv[i]}"`);
  }
  if (newest === undefined || !MONTH.test(newest)) {
    throw new Error("--newest YYYY-MM is required");
  }
  if (requested !== undefined && !MONTH.test(requested)) {
    throw new Error(`--requested must be YYYY-MM, got "${requested}"`);
  }
  return { newest, requested: requested ?? null };
}

function main(): void {
  const { newest, requested } = parseNextMonthArgs(process.argv.slice(2));
  const manifest = JSON.parse(readFileSync("src/data/manifest.json", "utf8"));
  const month = nextImportMonth(manifest.asAt, newest, requested);
  if (month !== null) console.log(month);
}

if (process.argv[1]?.endsWith("next-month.ts")) {
  try {
    main();
  } catch (error) {
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
  }
}
