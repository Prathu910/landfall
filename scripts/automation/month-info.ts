// Usage: tsx scripts/automation/month-info.ts [--month YYYY-MM] [--spotlight CODE]
// Prints `key=value` lines that monthly.sh reads, so the shell does no date
// arithmetic or JSON parsing of its own:
//   manifest_month  the as-at month of src/data/manifest.json
//   month           --month, else the month after manifest_month
//   previous_month  the month before `month`
//   short / long    "Nov 2026" / "November 2026", for commit and PR titles
//   data_on_base    yes when BASE_REF (default origin/main) already has the
//                   month's data section (spec decision 3: not regenerated)
//   spotlight_name  with --spotlight: the occupation's name
import { readFileSync } from "node:fs";
import { isManifest } from "../../src/lib/data/guards";
import { nextMonth, shiftMonth } from "../../src/lib/data/months";
import type { MonthKey } from "../../src/lib/data/types";
import { formatLongMonth, formatMonth } from "../../src/lib/report/copy";
import { hasPublishedData } from "../../src/lib/updates/frozen";
import { readBaseFile, verifyBase } from "./frozen-check";

const MONTH = /^\d{4}-(0[1-9]|1[0-2])$/;
const CODE = /^\d{6}$/;

export type MonthInfoArgs = {
  month: MonthKey | null;
  spotlight: string | null;
};

export function parseMonthInfoArgs(argv: string[]): MonthInfoArgs {
  let month: string | null = null;
  let spotlight: string | null = null;
  for (let i = 0; i < argv.length; i++) {
    if (argv[i] === "--month") month = argv[++i] ?? "";
    else if (argv[i] === "--spotlight") spotlight = argv[++i] ?? "";
    else throw new Error(`Unknown argument "${argv[i]}"`);
  }
  if (month !== null && !MONTH.test(month))
    throw new Error(`--month must be YYYY-MM, got "${month}"`);
  if (spotlight !== null && !CODE.test(spotlight))
    throw new Error(`--spotlight must be a six-digit code, got "${spotlight}"`);
  return { month, spotlight };
}

/** The occupation's name from the index; throws for a code it lacks. */
export function occupationName(
  index: { code: string; name: string }[],
  code: string,
): string {
  const entry = index.find((o) => o.code === code);
  if (!entry) throw new Error(`Occupation ${code} is not in the index`);
  return entry.name;
}

export type MonthInfo = {
  manifestMonth: MonthKey;
  month: MonthKey;
  dataOnBase: boolean;
  spotlightName: string | null;
};

export function monthInfoLines(info: MonthInfo): string[] {
  const lines = [
    `manifest_month=${info.manifestMonth}`,
    `month=${info.month}`,
    `previous_month=${shiftMonth(info.month, -1)}`,
    `short=${formatMonth(info.month)}`,
    `long=${formatLongMonth(info.month)}`,
    `data_on_base=${info.dataOnBase ? "yes" : "no"}`,
  ];
  // A name is one line in the index, but never let one break the format.
  if (info.spotlightName !== null)
    lines.push(`spotlight_name=${info.spotlightName.replace(/\s+/g, " ")}`);
  return lines;
}

const readJson = (file: string): unknown =>
  JSON.parse(readFileSync(file, "utf8"));

function main(): void {
  const args = parseMonthInfoArgs(process.argv.slice(2));
  const manifest = readJson("src/data/manifest.json");
  if (!isManifest(manifest))
    throw new Error("src/data/manifest.json is invalid");
  const month = args.month ?? nextMonth(manifest.asAt);
  const base = process.env.BASE_REF ?? "origin/main";
  verifyBase(base);
  const baseFacts = readBaseFile(base, `src/data/updates/${month}.json`);
  const index = readJson("src/data/occupation-index.json") as {
    code: string;
    name: string;
  }[];
  const lines = monthInfoLines({
    manifestMonth: manifest.asAt,
    month,
    dataOnBase: hasPublishedData(baseFacts),
    spotlightName: args.spotlight && occupationName(index, args.spotlight),
  });
  console.log(lines.join("\n"));
}

// tsx runs this file as CommonJS, so there is no top-level await.
if (process.argv[1]?.endsWith("month-info.ts")) {
  try {
    main();
  } catch (error) {
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
  }
}
