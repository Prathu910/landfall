// Usage: npm run data:import -- --as-at YYYY-MM [--backfill] [--checked-at YYYY-MM-DD]
//        npm run data:generate -- --as-at YYYY-MM [--checked-at YYYY-MM-DD] [--rounds-html <dir>]
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import type { MonthKey } from "../../src/lib/data/types";
import { generate, writeGenerated, type GeneratedData } from "./generate";
import { readRoundsFile } from "./generate-rounds";
import { fetchViews } from "./import-fetch";
import { readPreviousData } from "./previous-data";
import { PAGE_READ_BUDGET, planFetches, type ImportMode } from "./import-plan";
import { openQlikSession } from "./qlik-client";
import { readRawView, writeRawView, type RawViewFile } from "./raw-store";
import { keepStoredRounds, writeRoundPage } from "./round-store";
import {
  fetchRoundPages,
  parseCurrentRound,
  parseRoundPagesDetailed,
  type RoundPages,
  type TieBreakMisprint,
} from "./rounds";
import { validateGenerated } from "./validate-generated";

export type CliArgs = {
  asAt: MonthKey;
  mode: ImportMode;
  generateOnly: boolean;
  checkedAt: string; // YYYY-MM-DD
  /** A folder holding saved invitation-rounds.html and previous-rounds.html. */
  roundsHtml: string | null;
};

const RAW_ROOT = "data/raw";
const OUT_ROOT = "src/data";
const IMPORT_VERSION = "1";
const THROTTLE_MS = 250;
// The dashboard streams about 12 KB/s here, so one 10,000-cell page can take
// over a minute.
const CALL_TIMEOUT_MS = 300_000;

function isCalendarDate(text: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(text)) return false;
  const date = new Date(`${text}T00:00:00Z`);
  return !Number.isNaN(date.getTime()) && date.toISOString().startsWith(text);
}

function localToday(): string {
  const now = new Date();
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
}

export function parseArgs(argv: string[]): CliArgs {
  let asAt: string | undefined;
  let checkedAt = localToday();
  let backfill = false;
  let generateOnly = false;
  let roundsHtml: string | null = null;
  for (let i = 0; i < argv.length; i++) {
    const flag = argv[i];
    if (flag === "--backfill") backfill = true;
    else if (flag === "--generate-only") generateOnly = true;
    else if (flag === "--rounds-html") roundsHtml = argv[++i] ?? "";
    else if (flag === "--as-at") asAt = argv[++i];
    else if (flag === "--checked-at") checkedAt = argv[++i];
    else throw new Error(`Unknown argument "${flag}"`);
  }
  if (asAt === undefined) throw new Error("--as-at YYYY-MM is required");
  if (!/^\d{4}-(0[1-9]|1[0-2])$/.test(asAt)) {
    throw new Error(`--as-at must be YYYY-MM, got "${asAt}"`);
  }
  if (!isCalendarDate(checkedAt ?? "")) {
    throw new Error(`--checked-at must be YYYY-MM-DD, got "${checkedAt}"`);
  }
  if (generateOnly && backfill) {
    throw new Error("--generate-only fetches nothing; drop --backfill");
  }
  if (
    roundsHtml !== null &&
    (roundsHtml === "" || roundsHtml.startsWith("--"))
  ) {
    throw new Error("--rounds-html needs a folder");
  }
  if (roundsHtml !== null && !generateOnly) {
    throw new Error("--rounds-html needs --generate-only");
  }
  return {
    asAt,
    mode: backfill ? "backfill" : "monthly",
    generateOnly,
    checkedAt,
    roundsHtml,
  };
}

function readJson(path: string): unknown {
  return existsSync(path) ? JSON.parse(readFileSync(path, "utf8")) : undefined;
}

/** --generate-only rebuilds from the rounds stored by the last import. */
function readStoredRounds(): RoundPages {
  return readRoundsFile(readJson(join(OUT_ROOT, "rounds.json")));
}

/**
 * The stored rounds that newly read pages may only add to. A file without a
 * schemaVersion predates v2 and can't be kept, so every round is re-parsed
 * from the pages (once, when moving to v2).
 */
function readKeptRounds(): RoundPages | null {
  const value = readJson(join(OUT_ROOT, "rounds.json"));
  const legacy =
    value === undefined ||
    (typeof value === "object" &&
      value !== null &&
      !("schemaVersion" in value));
  if (legacy) {
    console.log("No v2 rounds.json: every round is parsed from the pages");
    return null;
  }
  return readRoundsFile(value);
}

/** Misprinted tie-breaks in rounds being added (stored rounds are kept). */
function printMisprints(
  misprints: TieBreakMisprint[],
  stored: RoundPages | null,
): void {
  const storedDates = new Set(stored?.rounds.map((round) => round.date));
  const added = misprints.filter((m) => !storedDates.has(m.date));
  console.log(`Tie-break misprints stored as no date: ${added.length}`);
  for (const m of added) console.log(`  ${m.date} ${m.where}: "${m.text}"`);
}

/** Parses both pages, keeps the stored rounds and saves the current page. */
function readRoundPages(currentHtml: string, previousHtml: string): RoundPages {
  const parsed = parseRoundPagesDetailed(currentHtml, previousHtml);
  console.log(`189 rounds parsed: ${parsed.rounds.length}`);
  const stored = readKeptRounds();
  const pages = keepStoredRounds(stored, {
    rounds: parsed.rounds,
    skipped: parsed.skipped,
  });
  printMisprints(parsed.misprints, stored);
  const date = parseCurrentRound(currentHtml).date;
  console.log(`Stored ${writeRoundPage(RAW_ROOT, date, currentHtml)}`);
  return pages;
}

function readSavedRoundPages(dir: string): RoundPages {
  const read = (name: string) => readFileSync(join(dir, name), "utf8");
  return readRoundPages(
    read("invitation-rounds.html"),
    read("previous-rounds.html"),
  );
}

function printSkipped(pages: RoundPages): void {
  console.log(`Skipped rounds: ${pages.skipped.length}`);
  for (const round of pages.skipped) {
    console.log(`  ${round.date}: ${round.reason}`);
  }
}

async function fetchRounds(): Promise<RoundPages> {
  const { currentHtml, previousHtml } = await fetchRoundPages();
  return readRoundPages(currentHtml, previousHtml);
}

function rowCount(file: RawViewFile | undefined): number {
  return (file?.parts ?? []).reduce((n, part) => n + part.table.rows.length, 0);
}

/** Writes one fetched file; a changed month becomes a new revision. */
function storeRaw(file: RawViewFile, revisions: string[]): void {
  const before = readRawView(RAW_ROOT, file.asAt, file.viewId);
  const { path, revised } = writeRawView(RAW_ROOT, file);
  if (revised) {
    revisions.push(
      `  ${path}: ${rowCount(before)} rows before, ${rowCount(file)} after`,
    );
  }
}

/**
 * Each finished view-month is stored at once, so a failure keeps complete
 * files only and a re-run backfill resumes after them. src/data is not
 * touched until everything validates.
 */
async function fetchRaw(args: CliArgs): Promise<void> {
  const budget = PAGE_READ_BUDGET[args.mode];
  const jobs = planFetches(
    args.asAt,
    args.mode,
    (viewId, month) => readRawView(RAW_ROOT, month, viewId) !== undefined,
  );
  console.log(`${args.mode}: ${jobs.length} view-months, budget ${budget}`);
  // A finished backfill has nothing left to fetch; don't connect at all.
  if (jobs.length === 0) return;
  const revisions: string[] = [];
  const session = await openQlikSession({
    throttleMs: THROTTLE_MS,
    maxPageReads: budget,
    callTimeoutMs: CALL_TIMEOUT_MS,
  });
  try {
    await fetchViews(session, jobs, {
      log: (line) => console.log(line),
      onFile: (file) => storeRaw(file, revisions),
      readStoredPool: (month) => readRawView(RAW_ROOT, month, "pool-by-score"),
    });
  } finally {
    console.log(`Page reads used: ${session.pageReads()} of ${budget}`);
    console.log(`Revisions found: ${revisions.length}`);
    for (const line of revisions) console.log(line);
    session.close();
  }
}

function report(data: GeneratedData, issues: string[]): void {
  const unmatched = data.manifest.roundsUnmatched;
  console.log(`Occupations: ${data.manifest.occupations.length}`);
  console.log(`Unmatched round names: ${unmatched.length}`);
  for (const name of unmatched) console.log(`  ${name}`);
  console.log(`Validation issues: ${issues.length}`);
  for (const issue of issues) console.log(`  ${issue}`);
}

async function main(): Promise<void> {
  const started = Date.now();
  try {
    const args = parseArgs(process.argv.slice(2));
    let rounds: RoundPages;
    if (args.roundsHtml !== null) {
      rounds = readSavedRoundPages(args.roundsHtml);
    } else if (args.generateOnly) {
      rounds = readStoredRounds();
    } else {
      rounds = await fetchRounds();
      await fetchRaw(args);
    }
    printSkipped(rounds);
    // Every mode that writes src/data carries dropped occupations forward.
    const previous = readPreviousData(OUT_ROOT);
    const data = generate({
      previous,
      rawRoot: RAW_ROOT,
      asAt: args.asAt,
      checkedAt: args.checkedAt,
      rounds,
      importVersion: IMPORT_VERSION,
    });
    const issues = validateGenerated(data, previous?.manifest ?? null);
    report(data, issues);
    if (issues.length > 0) {
      console.log(`Not written: ${OUT_ROOT} is unchanged`);
      process.exitCode = 1;
      return;
    }
    writeGenerated(OUT_ROOT, data);
    console.log(`Wrote ${OUT_ROOT} (${data.manifest.snapshotId})`);
  } catch (error) {
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
  } finally {
    console.log(`Duration: ${((Date.now() - started) / 1000).toFixed(0)} s`);
  }
}

// tsx runs this file as CommonJS, so there is no top-level await; tests import
// parseArgs without starting an import.
if (process.argv[1]?.endsWith("cli.ts")) void main();
