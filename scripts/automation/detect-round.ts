// Usage: tsx scripts/automation/detect-round.ts --dir <dir>
// Prints `key=value` lines that round.sh reads:
//   status  "new" when the official current invitation rounds page shows a
//           round newer than every round in src/data/rounds.json, else "none"
//   newest  that page's round date (YYYY-MM-DD), which names the round branch
// The page comes from <dir>/invitation-rounds.html when the run has it
// already (a second detection, or a dry run's saved pages); otherwise it is
// requested once, after the robots.txt check, and saved there
// (round-pages.ts).
import { readFileSync } from "node:fs";
import { isRoundsFile } from "../../src/lib/data/rounds-file";
import { newestRoundDate } from "../import/rounds";
import { liveDeps, savedRoundPage } from "./round-pages";

/** "new" when the current page's round is newer than every stored round. */
export function detectRound(
  storedRounds: unknown,
  currentHtml: string,
): "new" | "none" {
  if (!isRoundsFile(storedRounds)) {
    throw new Error(
      "src/data/rounds.json is missing or not a schemaVersion 2 rounds file",
    );
  }
  const current = newestRoundDate(currentHtml);
  // YYYY-MM-DD strings compare in calendar order.
  return storedRounds.rounds.every((round) => round.date < current)
    ? "new"
    : "none";
}

/** The lines main prints: the status, then the current page's round date. */
export function detectionLines(
  storedRounds: unknown,
  currentHtml: string,
): string[] {
  return [
    `status=${detectRound(storedRounds, currentHtml)}`,
    `newest=${newestRoundDate(currentHtml)}`,
  ];
}

async function main(): Promise<void> {
  const index = process.argv.indexOf("--dir");
  const dir = index === -1 ? undefined : process.argv[index + 1];
  if (!dir) throw new Error("Usage: detect-round.ts --dir <dir>");
  const html = await savedRoundPage(dir, "current", liveDeps());
  const stored = JSON.parse(readFileSync("src/data/rounds.json", "utf8"));
  console.log(detectionLines(stored, html).join("\n"));
}

// tsx runs this file as CommonJS, so there is no top-level await.
if (process.argv[1]?.endsWith("detect-round.ts")) {
  main().catch((error: unknown) => {
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
  });
}
