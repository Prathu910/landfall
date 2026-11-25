// Usage: tsx scripts/automation/detect-round.ts
// Prints `key=value` lines that round.sh reads:
//   status  "new" when the official current invitation rounds page shows a
//           round newer than every round in src/data/rounds.json, else "none"
//   newest  that page's round date (YYYY-MM-DD), which names the round branch
// Fetches the current page only; with ROUNDS_HTML_DIR set, reads
// $ROUNDS_HTML_DIR/invitation-rounds.html instead (tests and dry runs).
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { isRoundsFile } from "../../src/lib/data/rounds-file";
import {
  CURRENT_ROUNDS_URL,
  fetchRoundPage,
  newestRoundDate,
} from "../import/rounds";

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

/** The current invitation rounds page, from `dir` when given. */
export async function readCurrentRoundsPage(
  dir: string | undefined,
): Promise<string> {
  if (dir) return readFileSync(join(dir, "invitation-rounds.html"), "utf8");
  return fetchRoundPage(CURRENT_ROUNDS_URL);
}

async function main(): Promise<void> {
  const html = await readCurrentRoundsPage(process.env.ROUNDS_HTML_DIR);
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
