// Usage: npm run data:import -- --as-at YYYY-MM [--backfill | --keep-rounds] [--checked-at YYYY-MM-DD]
//        npm run data:import -- --rounds-only [--checked-at YYYY-MM-DD] [--rounds-html <dir>]
//        npm run data:import -- --probe
//        npm run data:generate -- --as-at YYYY-MM [--checked-at YYYY-MM-DD] [--rounds-html <dir>]
// Every mode except --probe also takes --report-file <path>.
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import type { Manifest, MonthKey } from "../../src/lib/data/types";
import { generate, writeGenerated, type GeneratedData } from "./generate";
import { readRoundsFile } from "./generate-rounds";
import { fetchViews } from "./import-fetch";
import { readPreviousData } from "./previous-data";
import { PAGE_READ_BUDGET, planFetches, type ImportMode } from "./import-plan";
import { openQlikSession } from "./qlik-client";
import { readRawView, writeRawView, type RawViewFile } from "./raw-store";
import { keepStoredRounds, storeCurrentRoundPage } from "./round-store";
import {
  fetchRoundPages,
  newestRoundDate,
  newRoundDates,
  parseRoundPagesDetailed,
  type RoundPages,
  type TieBreakMisprint,
} from "./rounds";
import { validateGenerated } from "./validate-generated";
import type { ImportReport } from "../../src/lib/updates/import-report";

export type CliArgs = {
  /** Null for --probe and --rounds-only, which name no month. */
  asAt: MonthKey | null;
  mode: ImportMode;
  /** Print the newest As At Month and write nothing. */
  probe: boolean;
  /** Where to write the ImportReport JSON, if anywhere. */
  reportFile: string | null;
  generateOnly: boolean;
  /** A monthly import that reads no round pages and keeps rounds.json. */
  keepRounds: boolean;
  /**
   * Read the round pages only (no dashboard) and rebuild the stored month;
   * checkedAt then becomes the manifest's roundsCheckedAt.
   */
  roundsOnly: boolean;
  checkedAt: string; // YYYY-MM-DD
  /** A folder holding saved invitation-rounds.html and previous-rounds.html. */
  roundsHtml: string | null;
};

export type { ImportReport };

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
  let keepRounds = false;
  let roundsOnly = false;
  let roundsHtml: string | null = null;
  let probe = false;
  let reportFile: string | null = null;
  const given: string[] = [];
  for (let i = 0; i < argv.length; i++) {
    const flag = argv[i];
    if (flag !== "--probe" && flag !== "--report-file") given.push(flag);
    if (flag === "--probe") probe = true;
    else if (flag === "--report-file") reportFile = argv[++i] ?? "";
    else if (flag === "--backfill") backfill = true;
    else if (flag === "--generate-only") generateOnly = true;
    else if (flag === "--keep-rounds") keepRounds = true;
    else if (flag === "--rounds-only") roundsOnly = true;
    else if (flag === "--rounds-html") roundsHtml = argv[++i] ?? "";
    else if (flag === "--as-at") asAt = argv[++i];
    else if (flag === "--checked-at") checkedAt = argv[++i];
    else throw new Error(`Unknown argument "${flag}"`);
  }
  if (
    reportFile !== null &&
    (reportFile === "" || reportFile.startsWith("--"))
  ) {
    throw new Error("--report-file needs a path");
  }
  if (probe) {
    if (given.length > 0) {
      throw new Error(`--probe takes only --report-file, not ${given[0]}`);
    }
    return {
      asAt: null,
      mode: "monthly",
      probe,
      reportFile,
      generateOnly: false,
      keepRounds: false,
      roundsOnly: false,
      checkedAt,
      roundsHtml: null,
    };
  }
  if (!isCalendarDate(checkedAt ?? "")) {
    throw new Error(`--checked-at must be YYYY-MM-DD, got "${checkedAt}"`);
  }
  if (
    roundsHtml !== null &&
    (roundsHtml === "" || roundsHtml.startsWith("--"))
  ) {
    throw new Error("--rounds-html needs a folder");
  }
  if (roundsOnly) {
    const other = given.find((flag) =>
      ["--as-at", "--backfill", "--generate-only", "--keep-rounds"].includes(
        flag,
      ),
    );
    if (other !== undefined) {
      throw new Error(
        `--rounds-only rebuilds the month in src/data/manifest.json; drop ${other}`,
      );
    }
    return {
      asAt: null,
      mode: "monthly",
      probe,
      reportFile,
      generateOnly: false,
      keepRounds: false,
      roundsOnly: true,
      checkedAt,
      roundsHtml,
    };
  }
  if (asAt === undefined) throw new Error("--as-at YYYY-MM is required");
  if (!/^\d{4}-(0[1-9]|1[0-2])$/.test(asAt)) {
    throw new Error(`--as-at must be YYYY-MM, got "${asAt}"`);
  }
  if (generateOnly && backfill) {
    throw new Error("--generate-only fetches nothing; drop --backfill");
  }
  if (keepRounds && (backfill || generateOnly || roundsHtml !== null)) {
    throw new Error(
      "--keep-rounds is for a monthly import; drop --backfill, --generate-only and --rounds-html",
    );
  }
  if (roundsHtml !== null && !generateOnly) {
    throw new Error("--rounds-html needs --generate-only or --rounds-only");
  }
  return {
    asAt,
    mode: backfill ? "backfill" : "monthly",
    probe,
    reportFile,
    generateOnly,
    keepRounds,
    roundsOnly: false,
    checkedAt,
    roundsHtml,
  };
}

/** The month a run writes and the dates its manifest records. */
export type GenerateTarget = {
  asAt: MonthKey;
  checkedAt: string;
  /** When the round pages were last read, if known. */
  roundsCheckedAt?: string;
  /** Raw revisions fetched after this date are ignored. */
  revisionsUpTo?: string;
};

/**
 * --rounds-only rebuilds the stored month as its dashboard was checked and
 * records today's round check. A run that reads no round pages
 * (--keep-rounds, --generate-only) keeps the date they were last read.
 */
export function generateTarget(
  args: CliArgs,
  stored: Manifest | null,
): GenerateTarget {
  if (args.roundsOnly) {
    if (stored === null) {
      throw new Error(
        "--rounds-only needs a valid src/data/manifest.json; run data:import first",
      );
    }
    return {
      asAt: stored.asAt,
      checkedAt: stored.checkedAt,
      roundsCheckedAt: args.checkedAt,
      revisionsUpTo: stored.checkedAt,
    };
  }
  const readsRoundPages = !args.generateOnly && !args.keepRounds;
  return {
    asAt: args.asAt as MonthKey,
    checkedAt: args.checkedAt,
    roundsCheckedAt: readsRoundPages
      ? args.checkedAt
      : (stored?.roundsCheckedAt ?? stored?.checkedAt),
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

/** Saves the current page unless its round is stored (see storeCurrentRoundPage). */
function saveCurrentPage(stored: RoundPages | null, currentHtml: string) {
  const date = newestRoundDate(currentHtml);
  const storedDates = new Set(stored?.rounds.map((round) => round.date));
  const { path, status } = storeCurrentRoundPage(
    RAW_ROOT,
    storedDates,
    date,
    currentHtml,
  );
  if (status === "saved") console.log(`Stored ${path}`);
  else if (status === "unchanged") console.log(`Unchanged ${path}`);
  else {
    console.log(
      `Kept ${path}: the ${date} round is already in rounds.json, so its saved page is not replaced by the page just read, which differs`,
    );
  }
}

/** Parses both pages, keeps the stored rounds and saves the current page. */
function readRoundPages(
  currentHtml: string,
  previousHtml: string,
  report: ImportReport,
): RoundPages {
  const parsed = parseRoundPagesDetailed(currentHtml, previousHtml);
  console.log(`189 rounds parsed: ${parsed.rounds.length}`);
  const stored = readKeptRounds();
  const pages = keepStoredRounds(stored, {
    rounds: parsed.rounds,
    skipped: parsed.skipped,
  });
  report.newRounds = newRoundDates(stored ?? { rounds: [] }, parsed);
  console.log(`New rounds: ${report.newRounds.join(", ") || "none"}`);
  printMisprints(parsed.misprints, stored);
  saveCurrentPage(stored, currentHtml);
  return pages;
}

function readSavedRoundPages(dir: string, report: ImportReport): RoundPages {
  const read = (name: string) => readFileSync(join(dir, name), "utf8");
  return readRoundPages(
    read("invitation-rounds.html"),
    read("previous-rounds.html"),
    report,
  );
}

function printSkipped(pages: RoundPages): void {
  console.log(`Skipped rounds: ${pages.skipped.length}`);
  for (const round of pages.skipped) {
    console.log(`  ${round.date}: ${round.reason}`);
  }
}

async function fetchRounds(report: ImportReport): Promise<RoundPages> {
  const { currentHtml, previousHtml } = await fetchRoundPages();
  return readRoundPages(currentHtml, previousHtml, report);
}

function rowCount(file: RawViewFile | undefined): number {
  return (file?.parts ?? []).reduce((n, part) => n + part.table.rows.length, 0);
}

/** Writes one fetched file; a changed month becomes a new revision. */
function storeRaw(file: RawViewFile, revisions: ImportReport["revisions"]) {
  const before = readRawView(RAW_ROOT, file.asAt, file.viewId);
  const { path, revised } = writeRawView(RAW_ROOT, file);
  if (revised) {
    revisions.push({
      path,
      rowsBefore: rowCount(before),
      rowsAfter: rowCount(file),
    });
  }
}

/**
 * Each finished view-month is stored at once, so a failure keeps complete
 * files only and a re-run backfill resumes after them. src/data is not
 * touched until everything validates.
 */
async function fetchRaw(
  args: CliArgs,
  asAt: MonthKey,
  report: ImportReport,
): Promise<void> {
  const budget = PAGE_READ_BUDGET[args.mode];
  report.budget = budget;
  const jobs = planFetches(
    asAt,
    args.mode,
    (viewId, month) => readRawView(RAW_ROOT, month, viewId) !== undefined,
  );
  console.log(`${args.mode}: ${jobs.length} view-months, budget ${budget}`);
  // A finished backfill has nothing left to fetch; don't connect at all.
  if (jobs.length === 0) return;
  const session = await openQlikSession({
    throttleMs: THROTTLE_MS,
    maxPageReads: budget,
    callTimeoutMs: CALL_TIMEOUT_MS,
  });
  try {
    await fetchViews(session, jobs, {
      log: (line) => console.log(line),
      onFile: (file) => storeRaw(file, report.revisions),
      readStoredPool: (month) => readRawView(RAW_ROOT, month, "pool-by-score"),
    });
  } finally {
    report.pageReads = session.pageReads();
    console.log(`Page reads used: ${report.pageReads} of ${budget}`);
    console.log(`Revisions found: ${report.revisions.length}`);
    for (const r of report.revisions) {
      console.log(
        `  ${r.path}: ${r.rowsBefore} rows before, ${r.rowsAfter} after`,
      );
    }
    session.close();
  }
}

function printSummary(data: GeneratedData, issues: string[]): void {
  const unmatched = data.manifest.roundsUnmatched;
  console.log(`Occupations: ${data.manifest.occupations.length}`);
  console.log(`Unmatched round names: ${unmatched.length}`);
  for (const name of unmatched) console.log(`  ${name}`);
  console.log(`Validation issues: ${issues.length}`);
  for (const issue of issues) console.log(`  ${issue}`);
}

/** The newest As At Month the dashboard lists. Reads no table. */
async function probeNewest(): Promise<MonthKey> {
  const session = await openQlikSession({
    throttleMs: THROTTLE_MS,
    maxPageReads: 0,
    callTimeoutMs: CALL_TIMEOUT_MS,
  });
  try {
    const months = await session.listAsAtMonths();
    return months[months.length - 1];
  } finally {
    session.close();
  }
}

function modeOf(args: CliArgs): ImportReport["mode"] {
  if (args.probe) return "probe";
  if (args.roundsOnly) return "rounds-only";
  return args.generateOnly ? "generate-only" : args.mode;
}

/** Saved pages, the stored rounds.json, or the official pages. */
async function readRounds(
  args: CliArgs,
  report: ImportReport,
): Promise<RoundPages> {
  if (args.roundsHtml !== null) {
    return readSavedRoundPages(args.roundsHtml, report);
  }
  if (args.generateOnly || args.keepRounds) {
    const stored = readStoredRounds();
    console.log(`Rounds kept from rounds.json: ${stored.rounds.length}`);
    return stored;
  }
  return fetchRounds(report);
}

function printTarget(target: GenerateTarget): void {
  console.log(
    `Writing ${target.asAt}: dashboard checked ${target.checkedAt}, rounds checked ${target.roundsCheckedAt ?? target.checkedAt}`,
  );
}

async function run(args: CliArgs, report: ImportReport): Promise<void> {
  if (args.probe) {
    report.newestAsAt = await probeNewest();
    console.log(`Newest As At Month: ${report.newestAsAt}`);
    return;
  }
  // Every mode that writes src/data carries dropped occupations forward.
  const previous = readPreviousData(OUT_ROOT);
  const target = generateTarget(args, previous?.manifest ?? null);
  report.asAt = target.asAt;
  printTarget(target);
  // Round pages first: a failure there costs no dashboard reads.
  const rounds = await readRounds(args, report);
  if (!args.generateOnly && !args.roundsOnly) {
    await fetchRaw(args, target.asAt, report);
  }
  printSkipped(rounds);
  const data = generate({
    ...target,
    previous,
    rawRoot: RAW_ROOT,
    rounds,
    importVersion: IMPORT_VERSION,
  });
  report.unmatched = data.manifest.roundsUnmatched;
  const issues = validateGenerated(data, previous?.manifest ?? null);
  printSummary(data, issues);
  if (issues.length > 0) {
    console.log(`Not written: ${OUT_ROOT} is unchanged`);
    process.exitCode = 1;
    return;
  }
  writeGenerated(OUT_ROOT, data);
  console.log(`Wrote ${OUT_ROOT} (${data.manifest.snapshotId})`);
}

async function main(): Promise<void> {
  const started = Date.now();
  let args: CliArgs | null = null;
  const report: ImportReport = {
    mode: "monthly",
    asAt: null,
    newestAsAt: null,
    pageReads: 0,
    budget: null,
    revisions: [],
    unmatched: [],
    newRounds: [],
    durationSeconds: 0,
  };
  try {
    args = parseArgs(process.argv.slice(2));
    report.mode = modeOf(args);
    report.asAt = args.asAt;
    await run(args, report);
  } catch (error) {
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
  } finally {
    report.durationSeconds = Math.round((Date.now() - started) / 1000);
    console.log(`Duration: ${report.durationSeconds} s`);
    // Written on failure too, with what is known by then.
    if (args?.reportFile) {
      writeFileSync(args.reportFile, `${JSON.stringify(report, null, 2)}\n`);
    }
  }
}

// tsx runs this file as CommonJS, so there is no top-level await; tests import
// parseArgs without starting an import.
if (process.argv[1]?.endsWith("cli.ts")) void main();
