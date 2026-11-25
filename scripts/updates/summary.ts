/**
 * `npm run updates:summary`: prints the PR description for a data update
 * (spec 6.12). With --append-to <body.md> it adds a dated section to that
 * body instead and prints the whole body. With --swap-into <body.md> (a
 * spotlight swap) it replaces that body's spotlight, images and publish line
 * for the month, keeps the rest, and needs no --import-report. Reads CF_PAGES_PROJECT (optional)
 * for the preview links. Needs no network.
 */
import { execFileSync } from "node:child_process";
import { existsSync, readFileSync, readdirSync } from "node:fs";
import path from "node:path";
import { isManifest, isOccupationCore } from "../../src/lib/data/guards";
import type { Interval, Manifest, MonthKey } from "../../src/lib/data/types";
import {
  parseCountText,
  sumIntervals,
} from "../../src/lib/data/published-count";
import { shiftMonth } from "../../src/lib/data/months";
import { sydneyDate } from "../../src/lib/updates/dates";
import { listRecapMonths, loadRecap } from "../../src/lib/updates/load-server";
import {
  appendSection,
  buildSummary,
  previewOrigin,
  replaceSwapParts,
  sectionHeading,
  type Coverage,
  type SummaryInput,
} from "../../src/lib/updates/summary-view";
import type { ImportReport } from "../import/cli";
import type { SetManifest } from "../social/compress";

// The founder's repository; Actions sets GITHUB_REPOSITORY.
const DEFAULT_REPOSITORY = "Prathu910/landfall";
const MONTH = /^\d{4}-(0[1-9]|1[0-2])$/;
const DATE = /^\d{4}-\d{2}-\d{2}$/;
const FLAGS = [
  "--month",
  "--kind",
  "--round",
  "--previous-manifest",
  "--import-report",
  "--build-log",
  "--branch",
  "--append-to",
  "--swap-into",
  "--today",
];

export type SummaryArgs = {
  month: MonthKey;
  kind: "data" | "round";
  round: string | null;
  previousManifest: string | null;
  /** Null only with --swap-into, which keeps the import's own lines. */
  importReport: string | null;
  buildLog: string | null;
  branch: string;
  appendTo: string | null;
  swapInto: string | null;
  today: string;
};

export function parseSummaryArgs(argv: string[]): SummaryArgs {
  const values = new Map<string, string>();
  for (let i = 0; i < argv.length; i += 2) {
    const flag = argv[i];
    if (!FLAGS.includes(flag)) throw new Error(`Unknown flag ${flag}`);
    const value = argv[i + 1];
    if (value === undefined || value.startsWith("--")) {
      throw new Error(`${flag} needs a value`);
    }
    if (values.has(flag)) throw new Error(`${flag} given twice`);
    values.set(flag, value);
  }
  const need = (flag: string): string => {
    const value = values.get(flag);
    if (!value) throw new Error(`${flag} is required`);
    return value;
  };
  const month = need("--month");
  if (!MONTH.test(month)) throw new Error("--month must be YYYY-MM");
  const kind = need("--kind");
  if (kind !== "data" && kind !== "round") {
    throw new Error("--kind must be data or round");
  }
  const round = values.get("--round") ?? null;
  if (kind === "round" && !(round && DATE.test(round))) {
    throw new Error("--kind round needs --round YYYY-MM-DD");
  }
  if (kind === "data" && round) throw new Error("--round is for --kind round");
  const swapInto = values.get("--swap-into") ?? null;
  if (swapInto && kind !== "data")
    throw new Error("--swap-into is for --kind data");
  if (swapInto && values.has("--append-to"))
    throw new Error("--swap-into and --append-to don't go together");
  const today = values.get("--today") ?? sydneyDate(new Date());
  if (!DATE.test(today)) throw new Error("--today must be YYYY-MM-DD");
  return {
    month,
    kind,
    round,
    previousManifest: values.get("--previous-manifest") ?? null,
    importReport: swapInto
      ? (values.get("--import-report") ?? null)
      : need("--import-report"),
    buildLog: values.get("--build-log") ?? null,
    branch: need("--branch"),
    appendTo: values.get("--append-to") ?? null,
    swapInto,
    today,
  };
}

const readJson = (file: string): unknown =>
  JSON.parse(readFileSync(file, "utf8"));

function readManifest(file: string): Manifest {
  const value = readJson(file);
  if (!isManifest(value)) throw new Error(`${file} is not a manifest`);
  return value;
}

/** The `WARNING` lines of a build log, with the label removed. */
export function warningLines(log: string): string[] {
  return log
    .split("\n")
    .filter((line) => /\bWARNING\b/.test(line))
    .map((line) => line.replace(/^.*?\bWARNING:?\s*/, "").trim())
    .filter(Boolean);
}

const allStatuses = (
  core: ReturnType<typeof readCore>,
  month: MonthKey,
): Interval | null => {
  const row = core?.statusHistory["189"]?.[month];
  return row ? sumIntervals(Object.values(row).map(parseCountText)) : null;
};

function readCore(code: string) {
  const file = path.join("src/data/occupations", `${code}.json`);
  if (!existsSync(file)) return null;
  const value = readJson(file);
  return isOccupationCore(value) ? value : null;
}

/** Software Engineer's 189 all-status sum for the month and the one before. */
export function coverageFor(month: MonthKey): Coverage | null {
  const core = readCore("261313");
  const current = allStatuses(core, month);
  return (
    current && { current, previous: allStatuses(core, shiftMonth(month, -1)) }
  );
}

function readSets(
  month: MonthKey,
  kind: "data" | "round",
  round: string | null,
) {
  const root = path.join("public/social", month);
  if (!existsSync(root)) return [];
  const wanted = kind === "round" ? [`round-${round}`] : ["month"];
  return readdirSync(root)
    .filter((dir) => wanted.includes(dir))
    .map((dir) => path.join(root, dir, "set.json"))
    .filter((file) => existsSync(file))
    .map((file) => readJson(file) as SetManifest);
}

/**
 * Months whose data section is on the base branch (BASE_REF, default
 * origin/main). Without that ref, every other month with a data section.
 */
export function publishedDataMonths(current: MonthKey): MonthKey[] {
  const ref = process.env.BASE_REF ?? "origin/main";
  try {
    const dir = "src/data/updates";
    const files = execFileSync(
      "git",
      ["ls-tree", "--name-only", `${ref}:${dir}/`],
      {
        encoding: "utf8",
        stdio: ["ignore", "pipe", "ignore"],
      },
    ).split("\n");
    return files
      .map((f) => /^(\d{4}-\d{2})\.json$/.exec(f)?.[1])
      .filter((m): m is MonthKey => m !== undefined)
      .filter((m) => {
        const text = execFileSync("git", ["show", `${ref}:${dir}/${m}.json`], {
          encoding: "utf8",
          maxBuffer: 64 * 1024 * 1024,
        });
        return (JSON.parse(text) as { data: unknown }).data !== null;
      });
  } catch {
    return listRecapMonths().filter(
      (m) => m !== current && loadRecap(m).data !== null,
    );
  }
}

/** A swap reads nothing; its "Needs your decision" lines are not used. */
const SWAP_REPORT: ImportReport = {
  mode: "generate-only",
  asAt: null,
  newestAsAt: null,
  pageReads: 0,
  budget: null,
  revisions: [],
  unmatched: [],
  newRounds: [],
  durationSeconds: 0,
};

function main(): void {
  try {
    const args = parseSummaryArgs(process.argv.slice(2));
    const project = process.env.CF_PAGES_PROJECT?.trim();
    const input: SummaryInput = {
      kind: args.kind,
      month: args.month,
      round: args.round,
      facts: loadRecap(args.month),
      manifest: readManifest("src/data/manifest.json"),
      previousManifest: args.previousManifest
        ? readManifest(args.previousManifest)
        : null,
      report: args.importReport
        ? (readJson(args.importReport) as ImportReport)
        : SWAP_REPORT,
      buildWarnings: args.buildLog
        ? warningLines(readFileSync(args.buildLog, "utf8"))
        : [],
      publishedDataMonths: publishedDataMonths(args.month),
      coverage: coverageFor(args.month),
      sets: readSets(args.month, args.kind, args.round),
      branch: args.branch,
      blobBase: `https://github.com/${process.env.GITHUB_REPOSITORY ?? DEFAULT_REPOSITORY}/blob`,
      previewBase: project ? previewOrigin(project, args.branch) : null,
      today: args.today,
    };
    const body = buildSummary(input);
    if (args.swapInto) {
      const existing = readFileSync(args.swapInto, "utf8");
      process.stdout.write(replaceSwapParts(existing, body, args.month));
      return;
    }
    if (!args.appendTo) {
      process.stdout.write(body);
      return;
    }
    const existing = readFileSync(args.appendTo, "utf8");
    process.stdout.write(appendSection(existing, body, sectionHeading(input)));
  } catch (error) {
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
  }
}

// tsx runs this file as CommonJS; tests import the parsers without running.
if (process.argv[1]?.endsWith("summary.ts")) main();
