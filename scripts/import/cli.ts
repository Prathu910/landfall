// Usage: npm run data:import -- --as-at YYYY-MM [--backfill] [--checked-at YYYY-MM-DD]
//        npm run data:generate -- --as-at YYYY-MM [--checked-at YYYY-MM-DD]
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { isManifest } from "../../src/lib/data/guards";
import type { Manifest, MonthKey } from "../../src/lib/data/types";
import {
  generate,
  writeGenerated,
  type GeneratedData,
  type RoundsFile,
} from "./generate";
import { fetchViews } from "./import-fetch";
import { PAGE_READ_BUDGET, planFetches, type ImportMode } from "./import-plan";
import { openQlikSession } from "./qlik-client";
import { readRawView, writeRawView, type RawViewFile } from "./raw-store";
import {
  fetchRoundPages,
  parseRoundPagesDetailed,
  type ParsedRound,
} from "./rounds";
import { validateGenerated } from "./validate-generated";

export type CliArgs = {
  asAt: MonthKey;
  mode: ImportMode;
  generateOnly: boolean;
  checkedAt: string; // YYYY-MM-DD
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
  for (let i = 0; i < argv.length; i++) {
    const flag = argv[i];
    if (flag === "--backfill") backfill = true;
    else if (flag === "--generate-only") generateOnly = true;
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
  return {
    asAt,
    mode: backfill ? "backfill" : "monthly",
    generateOnly,
    checkedAt,
  };
}

function readJson(path: string): unknown {
  return existsSync(path) ? JSON.parse(readFileSync(path, "utf8")) : undefined;
}

/** The legacy src/data files are not manifests, so they never count as one. */
function readPreviousManifest(): Manifest | null {
  const value = readJson(join(OUT_ROOT, "manifest.json"));
  return isManifest(value) ? value : null;
}

/** --generate-only rebuilds from the rounds stored by the last import. */
function readStoredRounds(): ParsedRound[] {
  const stored = readJson(join(OUT_ROOT, "rounds.json")) as
    RoundsFile | undefined;
  if (!Array.isArray(stored)) {
    throw new Error(`${OUT_ROOT}/rounds.json is missing; run data:import`);
  }
  return stored.map((round) => ({
    date: round.date,
    rows: round.rows.map(({ name, cutoff }) => ({
      occupationName: name,
      cutoff,
    })),
  }));
}

async function fetchRounds(): Promise<ParsedRound[]> {
  const { currentHtml, previousHtml } = await fetchRoundPages();
  const { rounds, skipped } = parseRoundPagesDetailed(
    currentHtml,
    previousHtml,
  );
  console.log(`189 rounds parsed: ${rounds.length}`);
  console.log(`Skipped rounds: ${skipped.length}`);
  for (const round of skipped) console.log(`  ${round.date}: ${round.reason}`);
  return rounds;
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
    let rounds: ParsedRound[];
    if (args.generateOnly) {
      rounds = readStoredRounds();
    } else {
      rounds = await fetchRounds();
      await fetchRaw(args);
    }
    const data = generate({
      rawRoot: RAW_ROOT,
      asAt: args.asAt,
      checkedAt: args.checkedAt,
      rounds,
      importVersion: IMPORT_VERSION,
    });
    const issues = validateGenerated(data, readPreviousManifest());
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
