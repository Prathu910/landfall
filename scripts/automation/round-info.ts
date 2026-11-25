// Usage: tsx scripts/automation/round-info.ts --round YYYY-MM-DD
// Prints `key=value` lines that round.sh reads, so the shell does no date
// arithmetic or JSON parsing of its own:
//   month    the round's data month, whose facts file holds its section
//   day      "15 Oct 2026", for commit and PR titles
//   on_base  yes when BASE_REF (default origin/main) already has the round's
//            section, which is frozen and never regenerated
import { monthOfDate } from "../../src/lib/updates/dates";
import { dayText } from "../../src/lib/updates/format";
import { hasPublishedRound } from "../../src/lib/updates/frozen";
import { readBaseFile, verifyBase } from "./frozen-check";

const DATE = /^\d{4}-(0[1-9]|1[0-2])-(0[1-9]|[12]\d|3[01])$/;

export function parseRoundInfoArgs(argv: string[]): string {
  if (argv.length !== 2 || argv[0] !== "--round")
    throw new Error("Usage: round-info.ts --round YYYY-MM-DD");
  const date = argv[1];
  if (!DATE.test(date))
    throw new Error(`--round must be YYYY-MM-DD, got "${date}"`);
  return date;
}

export function roundInfoLines(date: string, onBase: boolean): string[] {
  return [
    `month=${monthOfDate(date)}`,
    `day=${dayText(date)}`,
    `on_base=${onBase ? "yes" : "no"}`,
  ];
}

function main(): void {
  const date = parseRoundInfoArgs(process.argv.slice(2));
  const month = monthOfDate(date);
  const base = process.env.BASE_REF ?? "origin/main";
  verifyBase(base);
  const baseFacts = readBaseFile(base, `src/data/updates/${month}.json`);
  console.log(
    roundInfoLines(date, hasPublishedRound(baseFacts, date)).join("\n"),
  );
}

// tsx runs this file as CommonJS, so there is no top-level await.
if (process.argv[1]?.endsWith("round-info.ts")) {
  try {
    main();
  } catch (error) {
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
  }
}
